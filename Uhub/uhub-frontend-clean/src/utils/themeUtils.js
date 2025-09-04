// Theme utility functions for consistent dark mode styling across all pages

export const themeColors = {
  light: {
    // Backgrounds
    bgPrimary: 'bg-white',
    bgSecondary: 'bg-gray-50',
    bgTertiary: 'bg-gray-100',
    bgCard: 'bg-white',
    bgModal: 'bg-white',
    
    // Text
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-500',
    textInverse: 'text-white',
    
    // Borders
    borderPrimary: 'border-gray-200',
    borderSecondary: 'border-gray-300',
    borderAccent: 'border-blue-500',
    
    // Shadows
    shadowSm: 'shadow-sm',
    shadowMd: 'shadow-md',
    shadowLg: 'shadow-lg',
    shadowXl: 'shadow-xl',
    
    // Gradients
    gradientPrimary: 'from-blue-500 to-blue-600',
    gradientSecondary: 'from-purple-500 to-purple-600',
    gradientAccent: 'from-green-500 to-green-600',
    gradientBackground: 'from-gray-50 to-blue-50',
    
    // Hover states
    hoverBg: 'hover:bg-gray-50',
    hoverBorder: 'hover:border-gray-300',
    hoverText: 'hover:text-gray-900',
    
    // Focus states
    focusRing: 'focus:ring-blue-500',
    focusBorder: 'focus:border-blue-500',
  },
  
  dark: {
    // Backgrounds
    bgPrimary: 'bg-slate-900',
    bgSecondary: 'bg-slate-800',
    bgTertiary: 'bg-slate-700',
    bgCard: 'bg-slate-800',
    bgModal: 'bg-slate-800',
    
    // Text
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    textInverse: 'text-slate-900',
    
    // Borders
    borderPrimary: 'border-slate-700',
    borderSecondary: 'border-slate-600',
    borderAccent: 'border-blue-400',
    
    // Shadows
    shadowSm: 'shadow-slate-900/30',
    shadowMd: 'shadow-slate-900/40',
    shadowLg: 'shadow-slate-900/50',
    shadowXl: 'shadow-slate-900/60',
    
    // Gradients
    gradientPrimary: 'from-blue-600 to-blue-700',
    gradientSecondary: 'from-purple-600 to-purple-700',
    gradientAccent: 'from-green-600 to-green-700',
    gradientBackground: 'from-slate-800 to-slate-900',
    
    // Hover states
    hoverBg: 'hover:bg-slate-700',
    hoverBorder: 'hover:border-slate-600',
    hoverText: 'hover:text-slate-100',
    
    // Focus states
    focusRing: 'focus:ring-blue-400',
    focusBorder: 'focus:border-blue-400',
  }
};

export const getThemeClass = (isDark, lightClass, darkClass) => {
  return isDark ? darkClass : lightClass;
};

export const getThemeClasses = (isDark, classes) => {
  return {
    light: classes.light || '',
    dark: classes.dark || '',
    current: isDark ? classes.dark || '' : classes.light || ''
  };
};

// Common component theme classes
export const componentThemes = {
  card: (isDark) => ({
    container: `rounded-xl border transition-all duration-300 ${
      isDark 
        ? 'bg-slate-800 border-slate-700 shadow-slate-900/30' 
        : 'bg-white border-gray-200 shadow-md'
    }`,
    header: `p-6 border-b transition-colors duration-300 ${
      isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
    }`,
    body: `p-6 transition-colors duration-300 ${
      isDark ? 'bg-slate-800' : 'bg-white'
    }`,
    footer: `p-6 border-t transition-colors duration-300 ${
      isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
    }`
  }),
  
  button: (isDark, variant = 'primary') => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: isDark 
        ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl'
        : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg',
      secondary: isDark
        ? 'bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 border border-slate-600'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 border border-gray-300',
      outline: isDark
        ? 'bg-transparent hover:bg-slate-700 text-slate-300 border border-slate-600 focus:ring-slate-500'
        : 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-500',
      danger: isDark
        ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
        : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
    };
    
    return `${baseClasses} ${variants[variant]}`;
  },
  
  input: (isDark) => ({
    container: 'relative',
    input: `w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400 focus:ring-blue-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
    }`,
    label: `block text-sm font-medium mb-2 transition-colors duration-300 ${
      isDark ? 'text-slate-200' : 'text-gray-700'
    }`,
    error: 'text-red-600 text-sm mt-1'
  }),
  
  table: (isDark) => ({
    container: 'w-full overflow-hidden rounded-lg border transition-all duration-300',
    table: `min-w-full divide-y ${
      isDark ? 'divide-slate-700' : 'divide-gray-200'
    }`,
    thead: `transition-colors duration-300 ${
      isDark ? 'bg-slate-800' : 'bg-gray-50'
    }`,
    th: `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
      isDark ? 'text-slate-300 bg-slate-800' : 'text-gray-500 bg-gray-50'
    }`,
    tbody: `transition-colors duration-300 ${
      isDark ? 'bg-slate-900 divide-slate-700' : 'bg-white divide-gray-200'
    }`,
    td: `px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${
      isDark ? 'text-slate-300' : 'text-gray-900'
    }`,
    tr: `transition-colors duration-300 ${
      isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'
    }`
  }),
  
  modal: (isDark) => ({
    backdrop: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4',
    container: `rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border transition-all duration-300 ${
      isDark 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-gray-200'
    }`,
    header: `p-6 border-b transition-colors duration-300 ${
      isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
    }`,
    body: `p-6 transition-colors duration-300 ${
      isDark ? 'bg-slate-800' : 'bg-white'
    }`,
    footer: `p-6 border-t transition-colors duration-300 ${
      isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
    }`
  }),
  
  badge: (isDark, type = 'default') => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300';
    
    const types = {
      default: isDark
        ? 'bg-slate-700 text-slate-300 border border-slate-600'
        : 'bg-gray-100 text-gray-800 border border-gray-300',
      success: isDark
        ? 'bg-green-900/30 text-green-300 border border-green-700/50'
        : 'bg-green-100 text-green-800 border border-green-200',
      warning: isDark
        ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50'
        : 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      danger: isDark
        ? 'bg-red-900/30 text-red-300 border border-red-700/50'
        : 'bg-red-100 text-red-800 border border-red-200',
      info: isDark
        ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50'
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    return `${baseClasses} ${types[type]}`;
  }
};

// Page-specific theme helpers
export const pageThemes = {
  dashboard: (isDark) => ({
    container: `min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
    }`,
    card: `rounded-2xl border transition-all duration-300 ${
      isDark 
        ? 'bg-slate-800/80 border-slate-700/50 backdrop-blur-xl' 
        : 'bg-white/80 border-gray-200/50 backdrop-blur-xl'
    }`,
    header: `mb-8 transition-colors duration-300 ${
      isDark ? 'text-slate-100' : 'text-gray-900'
    }`,
    subtitle: `transition-colors duration-300 ${
      isDark ? 'text-slate-400' : 'text-gray-600'
    }`
  }),
  
  form: (isDark) => ({
    container: `space-y-6 transition-all duration-300 ${
      isDark ? 'text-slate-100' : 'text-gray-900'
    }`,
    section: `p-6 rounded-xl border transition-all duration-300 ${
      isDark 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-white/50 border-gray-200/50'
    }`,
    label: `block text-sm font-medium transition-colors duration-300 ${
      isDark ? 'text-slate-200' : 'text-gray-700'
    }`,
    input: `mt-1 block w-full rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400 focus:ring-blue-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
    }`
  })
};

// Animation presets for theme transitions
export const themeAnimations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  stagger: (delay = 0.1) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut", delay }
  })
};

export default {
  themeColors,
  getThemeClass,
  getThemeClasses,
  componentThemes,
  pageThemes,
  themeAnimations
};
