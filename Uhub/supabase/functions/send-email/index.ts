import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FANOUT_ROLES = new Set([
  "admin",
  "super_admin",
  "hr_manager",
  "it_management",
  "it_manager",
  "it_technician",
  "it",
]);

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

function isActiveStatus(status: unknown) {
  if (status == null || status === "") return true;
  return String(status).toLowerCase() === "active";
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
    const email = String(row?.email ?? "").trim();
    if (!email || !isActiveStatus(row.status)) continue;
    emails.add(email);
  }
  return [...emails];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Minimal HTML strip for a text/plain fallback */
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
      error:
        "Missing SMTP secrets: set SMTP_USER, SMTP_PASS, and optionally SMTP_FROM.",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const to = body?.to;
    const subject = body?.subject;
    const html = body?.body;
    const roles = Array.isArray(body?.roles) ? body.roles.map(String) : [];

    if (!subject) {
      return json({ ok: false, error: "Missing required field: subject" }, 400);
    }

    const recipients = to == null ? [] : Array.isArray(to) ? to : [to];
    const cleanTo = recipients
      .map((e: unknown) => String(e ?? "").trim())
      .filter(Boolean);

    if (roles.length > 0) {
      const roleEmails = await resolveEmailsByRoles(roles);
      for (const email of roleEmails) {
        if (!cleanTo.includes(email)) cleanTo.push(email);
      }
    }

    if (cleanTo.length === 0) {
      if (roles.length > 0) {
        return json({ ok: true, recipients: 0, skipped: true, provider: "none" });
      }
      return json({ ok: false, error: "Missing required fields: to or roles" }, 400);
    }

    const htmlBody = typeof html === "string" ? html : "";
    const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "resend").toLowerCase();

    let result: { ok: true } | { ok: false; error: string };

    if (provider === "smtp") {
      result = await sendViaSmtp(cleanTo, subject, htmlBody);
    } else {
      result = await sendViaResend(cleanTo, subject, htmlBody);
      // Optional fallback if Resend secrets missing but SMTP is configured
      if (!result.ok && Deno.env.get("SMTP_USER") && Deno.env.get("SMTP_PASS")) {
        console.warn("Resend failed, falling back to SMTP:", result.error);
        result = await sendViaSmtp(cleanTo, subject, htmlBody);
      }
    }

    if (!result.ok) {
      return json({ ok: false, error: result.error }, 500);
    }

    return json({ ok: true, provider: provider === "smtp" ? "smtp" : "resend", recipients: cleanTo.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-email error:", message);
    return json({ ok: false, error: message }, 500);
  }
});
