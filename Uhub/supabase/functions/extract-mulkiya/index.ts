import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersFor, json, requireCaller } from "../_shared/auth.ts";

const ALLOWED_ROLES = new Set([
  "admin",
  "super_admin",
  "operation_management",
  "driver_management",
  "data_operator",
]);

const MAX_BASE64 = 5_500_000; // ~4 MB binary
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const EXTRACT_PROMPT = `You are reading a UAE vehicle registration card (Mulkiya / رخصة المركبة).
Extract printed values. Prefer English text when both Arabic and English appear.
Do not invent values. If a field is not clearly printed, return null.
Important: car insurance expiry is usually on a separate insurance certificate, not the Mulkiya.
Only fill insurance_expiry if that date is clearly printed on THIS document.
Dates must be ISO YYYY-MM-DD.
Chassis / VIN should be uppercase with no spaces.
License plate should be the plate as printed (emirate letter + numbers), Latin characters.
owned_by is the registered owner / company name.
mulkiya_number is the registration / TC / card number if printed.
year is the model year (4 digits).`;

const FIELD_KEYS = [
  "license_plate",
  "make",
  "model",
  "year",
  "owned_by",
  "registration_expiry",
  "insurance_expiry",
  "engine_number",
  "chassis_number",
  "mulkiya_number",
] as const;

type Fields = Record<(typeof FIELD_KEYS)[number], string | null>;

function emptyFields(): Fields {
  return Object.fromEntries(FIELD_KEYS.map((k) => [k, null])) as Fields;
}

function toIsoDate(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    let year = dmy[3];
    if (year.length === 2) year = Number(year) > 50 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return null;
}

function normalize(parsed: Record<string, unknown>): { fields: Fields; warnings: string[] } {
  const fields = emptyFields();
  const warnings: string[] = [];
  for (const key of FIELD_KEYS) {
    const v = parsed[key];
    if (v == null || v === "") {
      fields[key] = null;
      continue;
    }
    let text = String(v).trim();
    if (key === "chassis_number") text = text.toUpperCase().replace(/\s+/g, "");
    if (key === "engine_number") text = text.toUpperCase().replace(/\s+/g, "");
    if (key === "license_plate") text = text.toUpperCase().replace(/\s+/g, " ").trim();
    if (key === "year") {
      const year = text.match(/(19|20)\d{2}/);
      fields.year = year ? year[0] : null;
      continue;
    }
    if (key === "registration_expiry" || key === "insurance_expiry") {
      fields[key] = toIsoDate(text);
      continue;
    }
    fields[key] = text || null;
  }
  if (!fields.insurance_expiry) {
    warnings.push("Insurance expiry was not found on this card. Enter it from the insurance certificate.");
  }
  if (!fields.registration_expiry && !fields.license_plate && !fields.chassis_number) {
    warnings.push("This file may not be a readable Mulkiya. Try a sharper photo of the card.");
  }
  return { fields, warnings };
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return {};
  }
}

async function extractWithGemini(mimeType: string, base64: string): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
  if (!apiKey) throw new Error("missing-gemini");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACT_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message || `Gemini error (${res.status})`;
    throw new Error(message);
  }
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return parseJsonObject(text);
}

async function extractWithOpenAI(mimeType: string, base64: string): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("missing-openai");
  if (mimeType === "application/pdf") {
    throw new Error("OpenAI scan needs a photo of the Mulkiya, not a PDF. Attach a JPG or PNG, or set GEMINI_API_KEY.");
  }
  const model = Deno.env.get("OPENAI_VISION_MODEL") || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACT_PROMPT },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message || `OpenAI error (${res.status})`;
    throw new Error(message);
  }
  return parseJsonObject(payload?.choices?.[0]?.message?.content || "{}");
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
    if (!ALLOWED_ROLES.has(caller.role)) {
      return json(req, { ok: false, error: "You do not have permission to scan Mulkiya documents." }, 403);
    }

    const body = await req.json().catch(() => null);
    const mimeType = String(body?.mimeType || "").toLowerCase();
    const base64 = String(body?.base64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!ALLOWED_MIME.has(mimeType) || !base64) {
      return json(req, { ok: false, error: "Attach a Mulkiya image (JPG/PNG/WebP) or PDF." }, 400);
    }
    if (base64.length > MAX_BASE64) {
      return json(req, { ok: false, error: "File is too large to scan. Use a photo under 4 MB." }, 400);
    }

    const hasGemini = Boolean(Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY"));
    const hasOpenAI = Boolean(Deno.env.get("OPENAI_API_KEY"));
    if (!hasGemini && !hasOpenAI) {
      return json(req, {
        ok: false,
        error:
          "Mulkiya scan is not configured. Set GEMINI_API_KEY (recommended) or OPENAI_API_KEY in Supabase Edge Function secrets, then deploy extract-mulkiya.",
      }, 501);
    }

    let parsed: Record<string, unknown>;
    let provider = "gemini";
    if (hasGemini) {
      parsed = await extractWithGemini(mimeType, base64);
    } else {
      provider = "openai";
      parsed = await extractWithOpenAI(mimeType, base64);
    }

    const { fields, extraWarnings } = (() => {
      const result = normalize(parsed);
      return { fields: result.fields, extraWarnings: result.warnings };
    })();

    const warnings = [...extraWarnings];
    if (Array.isArray(parsed.warnings)) {
      for (const w of parsed.warnings) {
        const text = String(w || "").trim();
        if (text && !warnings.includes(text)) warnings.push(text);
      }
    }

    return json(req, { ok: true, provider, fields, warnings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    console.error("extract-mulkiya:", message);
    return json(req, { ok: false, error: message }, 500);
  }
});
