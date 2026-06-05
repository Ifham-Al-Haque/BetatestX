/**
 * Administrators — full UHub access including IT Request Inbox (assign, resolve, all requests).
 */
export const ADMIN_ROLES = ['admin', 'super_admin'];

/**
 * IT resolver roles — assign and resolve requests in Request Inbox (not full app admin).
 */
export const IT_RESOLVER_ROLES = [
  'it_management',
  'it_manager',
  'it_technician',
  'it',
];

/** Admin + IT resolvers (notifications, inbox, queue alerts). */
export const IT_STAFF_ROLES = [...ADMIN_ROLES, ...IT_RESOLVER_ROLES];

const IT_ALERT_ROLES = new Set(IT_STAFF_ROLES.map((r) => r.toLowerCase()));
const ADMIN_ROLE_SET = new Set(ADMIN_ROLES.map((r) => r.toLowerCase()));
const IT_RESOLVER_ROLE_SET = new Set(IT_RESOLVER_ROLES.map((r) => r.toLowerCase()));

const HR_ALERT_ROLES = new Set(['admin', 'super_admin', 'hr_manager']);

function normalizeRole(role) {
  if (role == null || role === '') return '';
  return String(role).trim().toLowerCase();
}

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isAdminRole(role) {
  return ADMIN_ROLE_SET.has(normalizeRole(role));
}

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isItResolverRole(role) {
  return IT_RESOLVER_ROLE_SET.has(normalizeRole(role));
}

/**
 * Can use Request Inbox: view all requests, assign, update status, resolve.
 * Admin/super_admin have full queue access; IT resolver roles manage the queue day-to-day.
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function canManageItRequestQueue(role) {
  return isAdminRole(role) || isItResolverRole(role);
}

/** @alias canManageItRequestQueue */
export const canViewAllItRequests = canManageItRequestQueue;

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isItAlertRecipientRole(role) {
  const r = normalizeRole(role);
  if (!r) return false;
  return IT_ALERT_ROLES.has(r);
}

/** IT staff + admin for inbox navigation helpers */
export const isItStaffRole = isItAlertRecipientRole;

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isHrAlertRecipientRole(role) {
  const r = normalizeRole(role);
  if (!r) return false;
  return HR_ALERT_ROLES.has(r);
}
