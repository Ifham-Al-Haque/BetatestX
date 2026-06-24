const MANAGE_ROLES = new Set(['admin', 'it_management']);
const DELETE_ROLES = new Set(['admin']);

export const canManageSimCards = (role) => MANAGE_ROLES.has(role);
export const canDeleteSimCards = (role) => DELETE_ROLES.has(role);

export const resolveUserRole = (user, userProfile) =>
  user?.user_metadata?.role || userProfile?.role || '';
