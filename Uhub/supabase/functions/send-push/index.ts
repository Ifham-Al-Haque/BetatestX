import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// =============================================================================
// send-push — sends a OneSignal push to a user by their external id (auth id).
// Secrets required (Supabase → Edge Functions → Secrets):
//   ONESIGNAL_APP_ID        = your OneSignal App ID
//   ONESIGNAL_REST_API_KEY  = your OneSignal REST API key (server key, keep secret)
// Request body: { externalUserId, title, message, url? }
// =============================================================================

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const { externalUserId, title, message, url } = await req.json();
    if (!externalUserId || !title) {
      return json({ ok: false, error: "Missing required fields: externalUserId, title" }, 400);
    }

    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    const restKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!appId || !restKey) {
      return json(
        { ok: false, error: "Missing OneSignal secrets: set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY." },
        500,
      );
    }

    const payload: Record<string, unknown> = {
      app_id: appId,
      // Target by external id (we call OneSignal.login(authUserId) on the client)
      include_aliases: { external_id: [String(externalUserId)] },
      target_channel: "push",
      headings: { en: String(title) },
      contents: { en: String(message ?? title) },
    };
    if (url) payload.url = String(url);

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // New OneSignal keys (os_v2_app_*) use the "Key" scheme; legacy keys used "Basic".
        Authorization: restKey.startsWith("os_v2_") ? `Key ${restKey}` : `Basic ${restKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data?.errors) {
      console.error("OneSignal error:", data);
      return json({ ok: false, error: data?.errors || `OneSignal HTTP ${res.status}` }, 502);
    }

    return json({ ok: true, id: data?.id, recipients: data?.recipients ?? 0 });
  } catch (e) {
    const messageText = e instanceof Error ? e.message : String(e);
    console.error("send-push error:", messageText);
    return json({ ok: false, error: messageText }, 500);
  }
});
