import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  ALLOWED_FANOUT_ROLES,
  adminClient,
  corsHeadersFor,
  isActiveStatus,
  json,
  requireCaller,
  safePushUrl,
  type Caller,
} from "../_shared/auth.ts";

const MAX_IDS = 30;
const MAX_TITLE = 120;
const MAX_MESSAGE = 500;

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

async function authorizeExternalIds(
  caller: Caller,
  requested: string[],
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const unique = [...new Set(requested.map(String).filter(Boolean))];
  if (unique.length === 0) return { ok: true, ids: [] };
  if (unique.length > MAX_IDS) {
    return { ok: false, error: `Too many recipients (max ${MAX_IDS})` };
  }

  const { data, error } = await adminClient()
    .from("users")
    .select("auth_user_id, role, status")
    .in("auth_user_id", unique);
  if (error) throw error;

  const byId = new Map(
    (data || [])
      .filter((row) => row?.auth_user_id && isActiveStatus(row.status))
      .map((row) => [String(row.auth_user_id), String(row.role || "").toLowerCase()]),
  );

  const allowed: string[] = [];
  for (const id of unique) {
    if (id === caller.authUserId) {
      allowed.push(id);
      continue;
    }
    const role = byId.get(id);
    if (!role) {
      return { ok: false, error: "Push recipients must be active UHub users" };
    }
    if (caller.isStaff || ALLOWED_FANOUT_ROLES.has(role)) {
      allowed.push(id);
      continue;
    }
    return { ok: false, error: "Not allowed to push that recipient" };
  }
  return { ok: true, ids: allowed };
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const callerOrErr = await requireCaller(req);
    if (callerOrErr instanceof Response) return callerOrErr;
    const caller = callerOrErr;

    const body = await req.json();
    const title = String(body?.title ?? "").trim().slice(0, MAX_TITLE);
    const message = String(body?.message ?? title).trim().slice(0, MAX_MESSAGE);
    const url = safePushUrl(body?.url);

    if (!title) {
      return json(req, { ok: false, error: "Missing required field: title" }, 400);
    }

    const requested: string[] = [];
    if (body?.externalUserId) requested.push(String(body.externalUserId));
    if (Array.isArray(body?.externalUserIds)) {
      for (const id of body.externalUserIds) {
        if (id) requested.push(String(id));
      }
    }

    const direct = await authorizeExternalIds(caller, requested);
    if (!direct.ok) {
      return json(req, { ok: false, error: direct.error }, 403);
    }

    const ids = new Set<string>(direct.ids);
    const roles = Array.isArray(body?.roles) ? body.roles.map(String) : [];
    if (roles.length > 0) {
      const resolved = await resolveAuthIdsByRoles(roles);
      for (const id of resolved) ids.add(id);
    }

    if (ids.size === 0) {
      return json(req, {
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
        req,
        { ok: false, error: "Missing OneSignal secrets: set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY." },
        500,
      );
    }

    const externalIds = [...ids];
    const data = await sendOneSignal(appId, restKey, externalIds, title, message, url);

    return json(req, {
      ok: true,
      id: data?.id,
      recipients: data?.recipients ?? externalIds.length,
    });
  } catch (e) {
    const messageText = e instanceof Error ? e.message : String(e);
    console.error("send-push error:", messageText);
    return json(req, { ok: false, error: "Failed to send push" }, 500);
  }
});
