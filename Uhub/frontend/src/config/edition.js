// =============================================================================
// App edition switch — lets us ship two products from one codebase:
//   * "full"      → MAIN APP: "Uhub" (everything) — default
//   * "operation" → SUB-APP:  "Udrive Fleet" (fleet maintenance / operation only)
//
// Controlled by REACT_APP_EDITION at build time:
//   REACT_APP_EDITION=operation npm run build
// =============================================================================

const RAW = (process.env.REACT_APP_EDITION || 'full').toLowerCase().trim();

export const APP_EDITION = RAW === 'operation' ? 'operation' : 'full';
export const isOperationEdition = APP_EDITION === 'operation';
export const isFullEdition = APP_EDITION === 'full';

// Display name / branding per edition
export const EDITION_APP_NAME = isOperationEdition
  ? (process.env.REACT_APP_APP_NAME || 'Udrive Fleet')
  : (process.env.REACT_APP_APP_NAME || 'Uhub');

export const EDITION_TAGLINE = isOperationEdition
  ? 'Fleet Maintenance & Operations'
  : 'Workplace Hub';

// Where users land after login in the operation edition
export const OPERATION_HOME_PATH = '/operation';

// Sidebar panels visible in the operation edition (others are hidden)
export const OPERATION_EDITION_PANELS = ['operation', 'user_profile', 'communication'];

// Path prefixes reachable in the operation edition. Anything else redirects
// to the operation home. Keep auth + profile + operation reachable.
export const OPERATION_EDITION_ALLOWED_PREFIXES = [
  '/operation',
  '/profile',
  '/settings',
  '/login',
  '/welcome',
  '/reset-password',
  // legacy fleet routes (they redirect into /operation/*)
  '/fleet',
];

export function isPathAllowedInEdition(pathname) {
  if (!isOperationEdition) return true;
  if (pathname === '/') return true;
  return OPERATION_EDITION_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p)
  );
}

export function isPanelVisibleInEdition(panelKey) {
  if (!isOperationEdition) return true;
  return OPERATION_EDITION_PANELS.includes(panelKey);
}
