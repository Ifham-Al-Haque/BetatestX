/**
 * Client-side helpers to reduce XSS and open-redirect risk.
 * Server-side RLS and validation remain the primary controls for Supabase-backed apps.
 */

/** Escape text for safe insertion into HTML (export/print templates). */
export function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns a same-origin path safe for window.location, or null.
 * Blocks javascript:, data:, and external https URLs (open-redirect / phishing).
 */
export function getSafeInternalUrl(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return null;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const u = new URL(trimmed, window.location.origin);
    if (u.origin === window.location.origin) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    return null;
  }
  return null;
}
