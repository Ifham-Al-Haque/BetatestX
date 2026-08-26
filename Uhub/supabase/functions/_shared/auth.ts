import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

const STAFF_ROLES = new Set([
  "admin",
  "super_admin",
  "hr_manager",
  "it_management",
  "it_manager",
  "it_technician",
  "it",
]);

export const ALLOWED_FANOUT_ROLES = STAFF_ROLES;

export type Caller = {
  authUserId: string;
  email: string;
  role: string;
  isStaff: boolean;
};

function allowedOrigins(): string[] {
  const extra = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost",
    "capacitor://localhost",
    "https://localhost",
    ...extra,
  ];
}

function originAllowed(origin: string): boolean {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "capacitor:") {
      return false;
    }
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "udrive.ae" || host.endsWith(".udrive.ae")) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allow = originAllowed(origin) ? origin : allowedOrigins()[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

export async function requireCaller(req: Request): Promise<Caller | Response> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) {
    return json(req, { ok: false, error: "Authentication required" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    return json(req, { ok: false, error: "Server is missing auth configuration" }, 500);
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser(token);
  const user: User | null = data?.user ?? null;
  if (error || !user?.id) {
    return json(req, { ok: false, error: "Invalid or expired session" }, 401);
  }

  const { data: row, error: roleError } = await adminClient()
    .from("users")
    .select("role, status, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (roleError) {
    return json(req, { ok: false, error: "Could not verify UHub account" }, 500);
  }
  if (!row) {
    return json(req, { ok: false, error: "No UHub account is linked to this login" }, 403);
  }
  if (row.status && String(row.status).toLowerCase() !== "active") {
    return json(req, { ok: false, error: "UHub account is inactive" }, 403);
  }

  const role = String(row.role || "").toLowerCase();
  return {
    authUserId: user.id,
    email: String(row.email || user.email || "").toLowerCase(),
    role,
    isStaff: STAFF_ROLES.has(role),
  };
}

export function isActiveStatus(status: unknown): boolean {
  if (status == null || status === "") return true;
  return String(status).toLowerCase() === "active";
}

export function safePushUrl(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const value = String(raw).trim();
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return undefined;
  }
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const allowed = allowedOrigins();
    const u = new URL(value);
    if (allowed.some((origin) => {
      try {
        return new URL(origin).origin === u.origin;
      } catch {
        return origin === u.origin;
      }
    })) {
      return u.toString();
    }
    if (u.hostname === "udrive.ae" || u.hostname.endsWith(".udrive.ae") || u.hostname.endsWith(".vercel.app")) {
      return u.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}
