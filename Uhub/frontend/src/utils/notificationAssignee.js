/**
 * Match assigned_to against the logged-in UHub user (auth id or users.id).
 */
export function isUserAssignee(user, userProfile, assigneeId) {
  if (!assigneeId || !user?.id) return false;
  const target = String(assigneeId);
  const authId = String(user.id);
  const usersId = userProfile?.usersTableId != null
    ? String(userProfile.usersTableId)
    : (userProfile?.id != null ? String(userProfile.id) : null);
  return target === authId || (usersId != null && target === usersId);
}
