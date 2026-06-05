/**
 * Roles that receive IT queue alerts (aligned with unifiedNotify IT_NOTIFY_ROLES).
 */
const IT_ALERT_ROLES = new Set([
  'admin',
  'super_admin',
  'it_management',
  'it_manager',
  'it_technician',
  'it',
]);

const HR_ALERT_ROLES = new Set(['admin', 'super_admin', 'hr_manager']);

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isItAlertRecipientRole(role) {
  if (role == null || role === '') return false;
  return IT_ALERT_ROLES.has(String(role).trim().toLowerCase());
}

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isHrAlertRecipientRole(role) {
  if (role == null || role === '') return false;
  return HR_ALERT_ROLES.has(String(role).trim().toLowerCase());
}
