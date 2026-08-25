import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// send-push — OneSignal push to UHub users.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   ONESIGNAL_APP_ID
//   ONESIGNAL_REST_API_KEY
//
// Body (one or more targeting fields):
//   { title, message?, url?,
//     externalUserId?, externalUserIds?,
//     roles?: ['hr_manager','admin'] }
//
// Role lookups use the service role so an employee submitter can still alert
// HR/IT without being able to SELECT those rows in public.users (RLS).
// =============================================================================

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

async function resolveAuthIdsByRoles(roles: string[]): Promise<string[]> {
  const allowed = [...new Set(roles.map(String).filter((r) => ALLOWED_FANOUT_ROLES.has(r)))];
  if (allowed.length === 0) return [];

  const { data, error } = await adminClient()
    .from("users")
    .select("auth_user_id, status")
    .in("role", allowed);

  if (error) throw error;

  const ids = new Set<string>();
  for (const row of data || []) {
    if (!row?.auth_user_id || !isActiveStatus(row.status)) continue;
    ids.add(String(row.auth_user_id));
  }
  return [...ids];
}

async function sendOneSignal(
  appId: string,
  restKey: string,
  externalIds: string[],
  title: string,
  message: string,
  url?: string,
) {
  const payload: Record<string, unknown> = {
    app_id: appId,
    include_aliases: { external_id: externalIds },
    target_channel: "push",
    headings: { en: title },
    contents: { en: message },
  };
  if (url) payload.url = url;

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: restKey.startsWith("os_v2_") ? `Key ${restKey}` : `Basic ${restKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.errors) {
    throw new Error(
      typeof data?.errors === "string"
        ? data.errors
        : JSON.stringify(data?.errors || `OneSignal HTTP ${res.status}`),
    );
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const title = body?.title;
    const message = body?.message;
    const url = body?.url;

    if (!title) {
      return json({ ok: false, error: "Missing required field: title" }, 400);
    }

    const ids = new Set<string>();
    if (body?.externalUserId) ids.add(String(body.externalUserId));
    if (Array.isArray(body?.externalUserIds)) {
      for (const id of body.externalUserIds) {
        if (id) ids.add(String(id));
      }
    }

    const roles = Array.isArray(body?.roles) ? body.roles.map(String) : [];
    if (roles.length > 0) {
      const resolved = await resolveAuthIdsByRoles(roles);
      for (const id of resolved) ids.add(id);
    }

    if (ids.size === 0) {
      return json({
        ok: true,
        recipients: 0,
        skipped: true,
        error: "No matching UHub users to push",
      });
    }

    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    const restKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!appId || !restKey) {
      return json(
        { ok: false, error: "Missing OneSignal secrets: set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY." },
        500,
      );
    }

    const externalIds = [...ids];
    const data = await sendOneSignal(
      appId,
      restKey,
      externalIds,
      String(title),
      String(message ?? title),
      url ? String(url) : undefined,
    );

    return json({
      ok: true,
      id: data?.id,
      recipients: data?.recipients ?? externalIds.length,
    });
  } catch (e) {
    const messageText = e instanceof Error ? e.message : String(e);
    console.error("send-push error:", messageText);
    return json({ ok: false, error: messageText }, 500);
  }
});
