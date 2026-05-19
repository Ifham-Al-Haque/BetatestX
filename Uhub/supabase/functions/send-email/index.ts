import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    if (!to || !subject) {
      return json({ ok: false, error: "Missing required fields: to, subject" }, 400);
    }

    const recipients = Array.isArray(to) ? to : [to];
    const cleanTo = recipients
      .map((e: unknown) => String(e ?? "").trim())
      .filter(Boolean);
    if (cleanTo.length === 0) {
      return json({ ok: false, error: "No valid recipients" }, 400);
    }

    const host = Deno.env.get("SMTP_HOST") ?? "smtp.office365.com";
    const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
    const user = Deno.env.get("SMTP_USER");
    const pass = Deno.env.get("SMTP_PASS");
    const from = Deno.env.get("SMTP_FROM") ?? user;

    if (!user || !pass || !from) {
      return json(
        {
          ok: false,
          error:
            "Missing SMTP secrets: set SMTP_USER, SMTP_PASS, and optionally SMTP_FROM in Supabase Edge Function secrets.",
        },
        500,
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2" },
    });

    const htmlBody = typeof html === "string" ? html : "";
    await transporter.sendMail({
      from,
      to: cleanTo.join(", "),
      subject: String(subject),
      html: htmlBody || undefined,
      text: htmlBody ? htmlToPlainText(htmlBody) : "",
    });

    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("send-email error:", message);
    return json({ ok: false, error: message }, 500);
  }
});
