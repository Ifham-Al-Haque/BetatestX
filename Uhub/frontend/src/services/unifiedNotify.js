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

/**
 * it_requests.requester_id must be auth.users.id (Supabase auth uid).
 * Live DB: FK + RLS use auth.uid() = requester_id; existing rows store auth ids.
 * Do NOT use public.users.id or employees.id here.
 */
export async function resolveItRequestRequesterId() {
  try {
    // Refresh so other users with a stale tab still get a valid auth uid
    await supabase.auth.refreshSession();
  } catch (e) {
    console.warn('resolveItRequestRequesterId: session refresh skipped', e?.message);
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('resolveItRequestRequesterId:', error.message);
    return null;
  }
  if (!user?.id) {
    console.warn('resolveItRequestRequesterId: no auth user id');
    return null;
  }

  // Sanity check: UHub users row should exist for display/notifications (not for FK if DB uses auth.users)
  const { data: uhubRow } = await supabase
    .from('users')
    .select('id, auth_user_id, email')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!uhubRow) {
    console.warn(
      'resolveItRequestRequesterId: no public.users row for auth_user_id',
      user.id,
      user.email
    );
  }

  return user.id;
}

/** Map DB FK errors to a message requesters can act on. */
export function formatItRequestSubmitError(error) {
  const msg = error?.message || '';
  if (msg.includes('it_requests_requester_id_fkey')) {
    return (
      'Your login could not be linked to IT Requests (requester account mismatch). ' +
      'Try signing out and back in. If it still fails, ask IT to run fix_it_requests_requester_fk.sql in Supabase.'
    );
  }
  if (msg.includes('JWT') || msg.includes('session') || msg.includes('not authenticated')) {
    return 'Your session expired. Please sign out, sign in again, then submit the request.';
  }
  return msg || 'Failed to submit IT request';
}

/** @deprecated alias */
export const getItRequestRequesterId = resolveItRequestRequesterId;

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

  if (!user.authUserId) {
    // Bell + RLS are keyed by auth.users.id; without the link the user can never see the in-app row.
    console.error(
      `notifyUhubUser: user "${user.fullName || personId}" has no auth_user_id link in the users table. ` +
      'In-app/bell notification will not be visible to them. Fix users.auth_user_id for this account.'
    );
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

    // Live popup via broadcast — reaches the user's open session even when
    // Postgres realtime on the notifications table is not enabled.
    try {
      await supabase.channel(`user_${notifyUserId}_notifications`).send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          id: `${type}_${Date.now()}`,
          type,
          title,
          message,
          priority,
          data,
          actionUrl,
          actionLabel,
          timestamp: new Date(),
          read: false,
        },
      });
    } catch (broadcastErr) {
      console.warn('notifyUhubUser broadcast failed:', broadcastErr?.message || broadcastErr);
    }
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

/**
 * Notify every UHub user holding any of the given roles.
 * In-app rows go through create_notifications_for_role (SECURITY DEFINER).
 * Push and email are resolved in Edge Functions with the service role, so an
 * employee submitter can still reach HR/IT when RLS hides those users.
 */
export async function notifyUhubUsersByRoles(service, roles, options) {
  const uniqueRoles = [...new Set((roles || []).filter(Boolean))];
  if (uniqueRoles.length === 0) return { users: 0, inApp: 0, push: 0, email: 0 };

  const {
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
  } = options || {};

  let inApp = 0;
  if (channels.inApp !== false) {
    const counts = await Promise.all(
      uniqueRoles.map((role) =>
        service.createNotificationsForRole({
          role,
          type,
          title,
          message,
          data,
          priority,
          actionUrl,
          actionLabel,
        })
      )
    );
    inApp = counts.reduce((sum, n) => sum + (Number(n) || 0), 0);
  } else if (channels.push !== false) {
    uniqueRoles.forEach((role) => {
      service._dispatchPushToRole(role, { title, message, actionUrl });
    });
  }

  let email = 0;
  if (channels.email !== false && title) {
    const html = buildTicketEmailHtml({
      heading: emailHeading || title,
      intro: emailIntro || message,
      lines: emailLines,
      accentColor: emailAccentColor,
      actionUrl,
      actionLabel,
    });
    try {
      const r = await emailService.sendToRoles(uniqueRoles, emailSubject || title, html);
      if (r?.success) email = r.recipients || uniqueRoles.length;
    } catch (e) {
      console.warn('notifyUhubUsersByRoles email failed:', e?.message);
    }
  }

  return { users: inApp, inApp, push: inApp || uniqueRoles.length, email };
}
