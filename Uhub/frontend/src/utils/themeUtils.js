// Theme utility functions — aligned with unified CSS tokens

export const themeColors = {
  light: {
    bgPrimary: 'bg-surface-base',
    bgSecondary: 'bg-surface-raised',
    bgTertiary: 'bg-surface-overlay',
    bgCard: 'uhub-card',
    bgModal: 'bg-surface-raised',
    textPrimary: 'text-content-primary',
    textSecondary: 'text-content-secondary',
    textMuted: 'text-content-muted',
    textInverse: 'text-white',
    borderPrimary: 'border-border',
    borderSecondary: 'border-border-secondary',
    borderAccent: 'border-border-accent',
    shadowMd: 'shadow-uhub-md',
    shadowLg: 'shadow-uhub-lg',
    gradientBackground: 'bg-uhub-canvas',
    hoverBg: 'hover:bg-surface-overlay',
    focusRing: 'focus:ring-accent',
  },
  dark: {
    bgPrimary: 'bg-surface-base',
    bgSecondary: 'bg-surface-raised',
    bgTertiary: 'bg-surface-overlay',
    bgCard: 'uhub-card',
    bgModal: 'bg-surface-raised',
    textPrimary: 'text-content-primary',
    textSecondary: 'text-content-secondary',
    textMuted: 'text-content-muted',
    textInverse: 'text-surface-base',
    borderPrimary: 'border-border',
    borderSecondary: 'border-border-secondary',
    borderAccent: 'border-border-accent',
    shadowMd: 'shadow-uhub-md',
    shadowLg: 'shadow-uhub-lg',
    gradientBackground: 'bg-uhub-canvas',
    hoverBg: 'hover:bg-surface-overlay',
    focusRing: 'focus:ring-accent',
  },
};

export const getThemeClass = (isDark, lightClass, darkClass) =>
  isDark ? darkClass : lightClass;

export const getThemeClasses = (isDark, classes) => ({
  light: classes.light || '',
  dark: classes.dark || '',
  current: isDark ? classes.dark || '' : classes.light || '',
});

export const componentThemes = {
  card: () => ({
    container: 'uhub-card',
    header: 'p-6 border-b border-border text-content-primary',
    body: 'p-6 text-content-primary',
    footer: 'p-6 border-t border-border bg-surface-overlay/50',
  }),

  cardGlass: () => ({
    container: 'uhub-card-glass p-6',
  }),

  button: (_isDark, variant = 'primary') => {
    const variants = {
      primary: 'uhub-btn-primary',
      secondary: 'uhub-btn-secondary',
      outline:
        'bg-transparent border border-border text-content-primary hover:bg-surface-overlay',
      danger: 'bg-accent-danger text-white hover:opacity-90',
    };
    return `font-medium rounded-lg px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 ${variants[variant] || variants.primary}`;
  },

  input: () => ({
    input: 'uhub-input',
    label: 'block text-sm font-medium text-content-secondary mb-2',
    error: 'text-accent-danger text-sm mt-1',
  }),

  table: () => ({
    container: 'w-full overflow-hidden rounded-xl border border-border enhanced-table',
    table: 'min-w-full divide-y divide-border',
    thead: 'bg-surface-overlay',
    th: 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-secondary',
    tbody: 'divide-y divide-border bg-surface-raised',
    td: 'px-6 py-4 whitespace-nowrap text-sm text-content-primary',
    tr: 'hover:bg-surface-overlay transition-colors',
  }),

  modal: () => ({
    backdrop: 'modal-backdrop',
    container: 'enhanced-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto',
    header: 'p-6 border-b border-border text-content-primary',
    body: 'p-6 text-content-primary',
    footer: 'p-6 border-t border-border',
  }),

  badge: (_isDark, type = 'default') => {
    const types = {
      default: 'bg-surface-overlay text-content-primary border border-border',
      success: 'uhub-badge-success',
      warning: 'uhub-badge-warning',
      danger: 'uhub-badge-danger',
      info: 'uhub-badge-info',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${types[type] || types.default}`;
  },
};

export const pageThemes = {
  dashboard: () => ({
    container: 'min-h-screen bg-uhub-canvas text-content-primary transition-colors duration-300',
    card: 'uhub-card-glass p-6',
    header: 'text-content-primary font-bold',
    subtitle: 'text-content-muted',
  }),
  form: () => ({
    container: 'space-y-6 text-content-primary',
    section: 'uhub-card p-6',
    label: 'block text-sm font-medium text-content-secondary mb-2',
    input: 'uhub-input',
  }),
};

export const themeAnimations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export default {
  themeColors,
  getThemeClass,
  getThemeClasses,
  componentThemes,
  pageThemes,
  themeAnimations,
};
