import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import {
  ALLOWED_FANOUT_ROLES,
  adminClient,
  corsHeadersFor,
  isActiveStatus,
  json,
  requireCaller,
  type Caller,
} from "../_shared/auth.ts";

const MAX_RECIPIENTS = 30;
const MAX_SUBJECT = 200;
const MAX_BODY = 50_000;

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendViaResend(
  cleanTo: string[],
  subject: string,
  htmlBody: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM");

  if (!apiKey || !from) {
    return {
      ok: false,
      error:
        "Missing Resend secrets: set RESEND_API_KEY and RESEND_FROM in Supabase Edge Function secrets.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: cleanTo,
      subject: String(subject),
      html: htmlBody || undefined,
      text: htmlBody ? htmlToPlainText(htmlBody) : undefined,
    }),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (payload as { message?: string })?.message ||
      (payload as { error?: string })?.error ||
      `Resend API error (${res.status})`;
    return { ok: false, error: message };
  }

  return { ok: true };
}

async function sendViaSmtp(
  cleanTo: string[],
  subject: string,
  htmlBody: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const host = Deno.env.get("SMTP_HOST") ?? "smtp.office365.com";
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  const from = Deno.env.get("SMTP_FROM") ?? user;

  if (!user || !pass || !from) {
    return {
      ok: false,
      error: "Missing SMTP secrets: set SMTP_USER, SMTP_PASS, and optionally SMTP_FROM.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
  });

  await transporter.sendMail({
    from,
    to: cleanTo.join(", "),
    subject: String(subject),
    html: htmlBody || undefined,
    text: htmlBody ? htmlToPlainText(htmlBody) : "",
  });

  return { ok: true };
}

async function resolveEmailsByRoles(roles: string[]): Promise<string[]> {
  const allowed = [...new Set(roles.map(String).filter((r) => ALLOWED_FANOUT_ROLES.has(r)))];
  if (allowed.length === 0) return [];

  const { data, error } = await adminClient()
    .from("users")
    .select("email, status")
    .in("role", allowed);

  if (error) throw error;

  const emails = new Set<string>();
  for (const row of data || []) {
    const email = String(row?.email ?? "").trim().toLowerCase();
    if (!email || !isActiveStatus(row.status)) continue;
    emails.add(email);
  }
  return [...emails];
}

async function loadUhubUsersByEmail(emails: string[]) {
  if (emails.length === 0) return [];
  const { data, error } = await adminClient()
    .from("users")
    .select("email, role, status")
    .in("email", emails);
  if (error) throw error;
  return data || [];
}

function normalizeEmails(to: unknown): string[] {
  const recipients = to == null ? [] : Array.isArray(to) ? to : [to];
  const unique = new Set<string>();
  for (const item of recipients) {
    const email = String(item ?? "").trim().toLowerCase();
    if (email && email.includes("@")) unique.add(email);
  }
  return [...unique];
}

async function authorizeRecipients(
  caller: Caller,
  requested: string[],
): Promise<{ ok: true; emails: string[] } | { ok: false; error: string }> {
  if (requested.length === 0) return { ok: true, emails: [] };
  if (requested.length > MAX_RECIPIENTS) {
    return { ok: false, error: `Too many recipients (max ${MAX_RECIPIENTS})` };
  }

  const rows = await loadUhubUsersByEmail(requested);
  const byEmail = new Map(
    rows
      .filter((row) => isActiveStatus(row.status))
      .map((row) => [String(row.email || "").trim().toLowerCase(), String(row.role || "").toLowerCase()]),
  );

  const allowed: string[] = [];
  for (const email of requested) {
    if (email === caller.email) {
      allowed.push(email);
      continue;
    }
    const role = byEmail.get(email);
    if (!role) {
      return { ok: false, error: "Recipients must be active UHub users" };
    }
    if (caller.isStaff || ALLOWED_FANOUT_ROLES.has(role)) {
      allowed.push(email);
      continue;
    }
    return { ok: false, error: "Not allowed to email that recipient" };
  }
  return { ok: true, emails: allowed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersFor(req) });
  }
  if (req.method !== "POST") {
    return json(req, { ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const callerOrErr = await requireCaller(req);
    if (callerOrErr instanceof Response) return callerOrErr;
    const caller = callerOrErr;

    const body = await req.json();
    const subject = String(body?.subject ?? "").trim().slice(0, MAX_SUBJECT);
    const html = typeof body?.body === "string" ? body.body.slice(0, MAX_BODY) : "";
    const roles = Array.isArray(body?.roles) ? body.roles.map(String) : [];

    if (!subject) {
      return json(req, { ok: false, error: "Missing required field: subject" }, 400);
    }

    const requested = normalizeEmails(body?.to);
    const direct = await authorizeRecipients(caller, requested);
    if (!direct.ok) {
      return json(req, { ok: false, error: direct.error }, 403);
    }

    const cleanTo = [...direct.emails];
    if (roles.length > 0) {
      const roleEmails = await resolveEmailsByRoles(roles);
      for (const email of roleEmails) {
        if (!cleanTo.includes(email)) cleanTo.push(email);
      }
    }

    if (cleanTo.length === 0) {
      if (roles.length > 0) {
        return json(req, { ok: true, recipients: 0, skipped: true, provider: "none" });
      }
      return json(req, { ok: false, error: "Missing required fields: to or roles" }, 400);
    }
    if (cleanTo.length > MAX_RECIPIENTS) {
      return json(req, { ok: false, error: `Too many recipients (max ${MAX_RECIPIENTS})` }, 400);
    }

    const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "resend").toLowerCase();
    let result: { ok: true } | { ok: false; error: string };

    if (provider === "smtp") {
      result = await sendViaSmtp(cleanTo, subject, html);
    } else {
      result = await sendViaResend(cleanTo, subject, html);
      if (!result.ok && Deno.env.get("SMTP_USER") && Deno.env.get("SMTP_PASS")) {
        console.warn("Resend failed, falling back to SMTP:", result.error);
        result = await sendViaSmtp(cleanTo, subject, html);
      }
    }

    if (!result.ok) {
      return json(req, { ok: false, error: result.error }, 500);
    }

    return json(req, {
      ok: true,
      provider: provider === "smtp" ? "smtp" : "resend",
      recipients: cleanTo.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-email error:", message);
    return json(req, { ok: false, error: "Failed to send email" }, 500);
  }
});
