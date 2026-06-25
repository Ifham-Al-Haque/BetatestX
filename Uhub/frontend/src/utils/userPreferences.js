const DEFAULT_PREFERENCES = {
  email_notifications: true,
  login_notifications: true,
  session_timeout: 30,
};

const storageKey = (userId) => `uhub_user_prefs_${userId}`;

export function loadUserPreferences(userId) {
  if (!userId) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveUserPreferences(userId, preferences) {
  if (!userId) return;
  localStorage.setItem(storageKey(userId), JSON.stringify(preferences));
}

export { DEFAULT_PREFERENCES };
