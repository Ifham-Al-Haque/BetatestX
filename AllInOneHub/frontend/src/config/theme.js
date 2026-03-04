/**
 * Corevanta – Brand theme (single source for colors)
 *
 * Palette: White + #083554 (navy) + #11278C (accent blue)
 *
 * How these 3 colors work together:
 * - #083554 (dark navy) – Primary dark: backgrounds, sidebar, headers. Strong contrast with white; feels solid and professional.
 * - #11278C (deep blue) – Accent: buttons, links, focus, CTAs. Pops on white and on navy; use for actions and emphasis.
 * - White (#ffffff) – Light backgrounds, text on dark, cards. Keeps the UI clear and readable.
 *
 * Variants below (navyLight, accentLight) are slight lightenings for hovers/layers so you stay on-brand.
 */

export const themeColors = {
  // Brand
  white: '#ffffff',
  navy: '#083554',       // Primary dark (backgrounds, sidebar)
  navyLight: '#0d4268',  // Slightly lighter navy (hover, cards)
  navyLighter: '#124a75',
  accent: '#11278C',     // Primary accent (buttons, links, focus)
  accentLight: '#1a32a8', // Hover state for accent
  accentMuted: 'rgba(17, 39, 140, 0.85)',

  // Semantic (keep for alerts, status)
  success: '#0d9488',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',

  // Dark mode (Corevanta navy base)
  dark: {
    bgPrimary: '#083554',
    bgSecondary: '#0d4268',
    bgTertiary: '#124a75',
    bgQuaternary: '#1a5a8c',
    sidebar: '#083554',
    sidebarHover: '#0d4268',
    sidebarActive: '#124a75',
  },

  // Light mode (white base)
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
  },

  // Gradients (navy → accent)
  gradients: {
    primary: 'linear-gradient(135deg, #083554 0%, #11278C 100%)',
    accent: 'linear-gradient(135deg, #11278C 0%, #1a32a8 100%)',
    header: 'linear-gradient(135deg, #083554 0%, #0d4268 50%, #11278C 100%)',
  },
};

export default themeColors;
