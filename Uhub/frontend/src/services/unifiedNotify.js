import { supabase } from '../supabaseClient';
import { emailService } from './emailService';

/** Roles that receive IT ticket alerts (in-app + push + email). */
export const IT_NOTIFY_ROLES = [
  'admin',
  'super_admin',
  'it_management',
  'it_manager',
  'it_technician',
  'it',
];

/** Roles that receive HR / complaint alerts. */
export const HR_NOTIFY_ROLES = ['admin', 'super_admin', 'hr_manager'];

export function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.REACT_APP_APP_URL || '';
}

/** Resolve public.users.id for it_requests.requester_id FK (never employees.id or auth uid alone). */
export async function resolveItRequestRequesterId(authOrUserId) {
  if (!authOrUserId) return null;
  const id = String(authOrUserId);

  const { data: byAuth, error: authError } = await supabase
    .from('users')
    .select('id, status')
    .eq('auth_user_id', id)
    .maybeSingle();

  if (authError) {
    console.warn('resolveItRequestRequesterId auth lookup failed:', authError.message);
  }
  if (byAuth?.id) return byAuth.id;

  const { data: byUsersId } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (byUsersId?.id) return byUsersId.id;

  return null;
}

/**
 * Resolve a person id to a UHub account holder (users first, employees fallback).
 * Returns auth user id for in-app/push and email from the users/employees record.
 */
export async function resolveUhubUser(personId) {
  if (!personId) return null;
  const id = String(personId);

  const [byUsersId, byUsersAuth, byEmpId, byEmpAuth] = await Promise.all([
    supabase.from('users').select('id, auth_user_id, email, full_name, role').eq('id', id).maybeSingle(),
    supabase.from('users').select('id, auth_user_id, email, full_name, role').eq('auth_user_id', id).maybeSingle(),
    supabase.from('employees').select('id, auth_user_id, email, full_name').eq('id', id).maybeSingle(),
    supabase.from('employees').select('id, auth_user_id, email, full_name').eq('auth_user_id', id).maybeSingle(),
  ]);

  const row = byUsersId.data || byUsersAuth.data || byEmpId.data || byEmpAuth.data;
  if (!row) return null;

  const isUhubUser = !!(byUsersId.data || byUsersAuth.data);
  return {
    usersId: isUhubUser ? row.id : null,
    authUserId: row.auth_user_id || (isUhubUser ? row.id : null),
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };
}

/** Fetch UHub users for one or more roles, deduped by auth id. */
export async function getUhubUsersByRoles(roles) {
  const uniqueRoles = [...new Set((roles || []).filter(Boolean))];
  if (uniqueRoles.length === 0) return [];

  const { data, error } = await supabase
    .from('users')
    .select('id, auth_user_id, email, full_name, role')
    .in('role', uniqueRoles);

  if (error) {
    console.warn('getUhubUsersByRoles failed:', error.message);
    return [];
  }

  const seen = new Set();
  return (data || []).filter((u) => {
    const key = u.auth_user_id || u.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildTicketEmailHtml({
  heading,
  intro,
  lines = [],
  accentColor = '#0d9488',
  actionUrl,
  actionLabel = 'View in UHub',
  footer = 'Automated notification from UHub.',
}) {
  const origin = getAppOrigin();
  const fullUrl = actionUrl && !actionUrl.startsWith('http') ? `${origin}${actionUrl}` : actionUrl;
  const rows = lines
    .filter((l) => l?.value != null && l.value !== '')
    .map((l) => `<p><strong>${l.label}:</strong> ${l.value}</p>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
      <div style="background: ${accentColor}; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">${heading}</h1>
      </div>
      <div style="padding: 20px; background: #f8f9fa; color: #111;">
        ${intro ? `<p>${intro}</p>` : ''}
        ${rows}
        ${fullUrl ? `<div style="text-align:center; margin: 24px 0;"><a href="${fullUrl}" style="background:${accentColor}; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">${actionLabel}</a></div>` : ''}
      </div>
      <div style="background:#f1f5f9; padding:12px; text-align:center; color:#64748b; font-size:12px;">${footer}</div>
    </div>`;
}

export async function getCurrentActor() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) return { fullName: 'UHub', email: '' };
    const resolved = await resolveUhubUser(authUser.id);
    return {
      fullName: resolved?.fullName || authUser.email || 'UHub',
      email: resolved?.email || authUser.email || '',
    };
  } catch {
    return { fullName: 'UHub', email: '' };
  }
}

/**
 * Notify one UHub user across channels: in-app (notifications table) + OneSignal push + email.
 * In-app and push work without an email address.
 */
export async function notifyUhubUser(service, {
  personId,
  type,
  title,
  message,
  data = {},
  priority = 'medium',
  actionUrl = null,
  actionLabel = null,
  emailSubject = null,
  emailHeading = null,
  emailIntro = null,
  emailLines = [],
  emailAccentColor = '#0d9488',
  channels = { inApp: true, push: true, email: true },
}) {
  const user = await resolveUhubUser(personId);
  if (!user) {
    console.warn('notifyUhubUser: no UHub user found for id', personId);
    return { inApp: false, push: false, email: false };
  }

  const notifyUserId = user.authUserId || personId;
  let inApp = false;
  let push = false;
  let email = false;

  if (channels.inApp !== false && notifyUserId) {
    const n = await service.createNotification({
      userId: notifyUserId,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
      actionLabel,
    });
    inApp = !!n;
    if (inApp) push = true;
  }

  if (channels.push !== false && user.authUserId && !push) {
    service._dispatchPush(user.authUserId, { title, message, actionUrl });
    push = true;
  }

  if (channels.email !== false && user.email?.trim()) {
    const html = buildTicketEmailHtml({
      heading: emailHeading || title,
      intro: emailIntro || message,
      lines: emailLines,
      accentColor: emailAccentColor,
      actionUrl,
      actionLabel,
    });
    try {
      const r = await emailService.sendNotification(user.email, emailSubject || title, html);
      email = !!r?.success;
    } catch (e) {
      console.warn('notifyUhubUser email failed:', e?.message);
    }
  }

  return { inApp, push, email, user };
}

/** Notify every UHub user holding any of the given roles. */
export async function notifyUhubUsersByRoles(service, roles, options) {
  const users = await getUhubUsersByRoles(roles);
  const results = await Promise.allSettled(
    users.map((u) =>
      notifyUhubUser(service, {
        ...options,
        personId: u.auth_user_id || u.id,
      })
    )
  );

  let inApp = 0;
  let push = 0;
  let email = 0;
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      if (r.value.inApp) inApp += 1;
      if (r.value.push) push += 1;
      if (r.value.email) email += 1;
    }
  });

  return { users: users.length, inApp, push, email };
}
