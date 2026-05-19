/**
 * Roles that receive IT queue alerts (aligned with simpleNotificationService + alert emails).
 * Use lowercase for comparison; app roles are stored lowercase in practice.
 */
const IT_ALERT_ROLES = new Set(['admin', 'it_management', 'it_manager', 'it']);

/**
 * @param {string | null | undefined} role
 * @returns {boolean}
 */
export function isItAlertRecipientRole(role) {
  if (role == null || role === '') return false;
  return IT_ALERT_ROLES.has(String(role).trim().toLowerCase());
}
