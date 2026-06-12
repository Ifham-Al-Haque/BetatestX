const STORAGE_KEY = 'uhub_recent_modules';
const MAX_RECENT = 8;
const SKIP_PATHS = new Set(['/', '/login', '/reset-password', '/welcome', '/signup']);

export const recordModuleVisit = (pathname) => {
  if (!pathname || SKIP_PATHS.has(pathname)) return;

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = stored.filter((entry) => entry.path !== pathname);
    const next = [{ path: pathname, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
};

export const getRecentModulePaths = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return stored.map((entry) => entry.path);
  } catch {
    return [];
  }
};
