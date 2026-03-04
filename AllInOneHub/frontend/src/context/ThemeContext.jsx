import React, { createContext, useContext, useEffect, useState } from 'react';
import themeColors from '../config/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const [systemPreference, setSystemPreference] = useState('light');

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newSystemPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newSystemPreference);
      
      // If user hasn't set a preference, follow system
      if (!localStorage.getItem('theme')) {
        setTheme(newSystemPreference);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    
    // Apply CSS variables for consistent theming
    const cssVars = getThemeCSSVariables(theme);
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Add smooth transition class
    root.classList.add('theme-transition');
    
    // Remove transition class after animation
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
  }, [theme]);

  const getThemeCSSVariables = (currentTheme) => {
    const d = themeColors.dark;
    const l = themeColors.light;
    if (currentTheme === 'dark') {
      return {
        '--bg-primary': d.bgPrimary,
        '--bg-secondary': d.bgSecondary,
        '--bg-tertiary': d.bgTertiary,
        '--bg-quaternary': d.bgQuaternary,
        '--bg-sidebar': d.sidebar,
        '--bg-sidebar-hover': d.sidebarHover,
        '--bg-sidebar-active': d.sidebarActive,
        '--text-primary': themeColors.white,
        '--text-secondary': 'rgba(255, 255, 255, 0.9)',
        '--text-muted': 'rgba(255, 255, 255, 0.7)',
        '--text-accent': themeColors.accentLight,
        '--text-success': themeColors.success,
        '--text-warning': themeColors.warning,
        '--text-danger': themeColors.danger,
        '--border-primary': 'rgba(255, 255, 255, 0.2)',
        '--border-secondary': 'rgba(255, 255, 255, 0.1)',
        '--border-accent': themeColors.accent,
        '--border-focus': themeColors.accent,
        '--accent-primary': themeColors.accent,
        '--accent-secondary': themeColors.accentLight,
        '--accent-success': themeColors.success,
        '--accent-warning': themeColors.warning,
        '--accent-danger': themeColors.danger,
        '--accent-info': themeColors.info,
        '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        '--shadow-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        '--gradient-primary': themeColors.gradients.primary,
        '--gradient-secondary': themeColors.gradients.accent,
        '--gradient-accent': themeColors.gradients.header,
        '--gradient-warm': 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
        '--gradient-cool': 'linear-gradient(135deg, #083554 0%, #11278C 100%)',
        '--card-bg': `rgba(8, 53, 84, 0.8)`,
        '--card-border': 'rgba(255, 255, 255, 0.2)',
        '--card-hover': themeColors.navyLight,
        '--input-bg': d.bgSecondary,
        '--input-border': 'rgba(255, 255, 255, 0.2)',
        '--input-focus': themeColors.accent,
        '--status-online': themeColors.success,
        '--status-offline': '#94a3b8',
        '--status-busy': themeColors.danger,
        '--status-away': themeColors.warning,
      };
    }
    return {
      '--bg-primary': l.bgPrimary,
      '--bg-secondary': l.bgSecondary,
      '--bg-tertiary': l.bgTertiary,
      '--bg-quaternary': '#e2e8f0',
      '--bg-sidebar': l.bgSecondary,
      '--bg-sidebar-hover': l.bgTertiary,
      '--bg-sidebar-active': '#e2e8f0',
      '--text-primary': themeColors.navy,
      '--text-secondary': '#334155',
      '--text-muted': '#64748b',
      '--text-accent': themeColors.accent,
      '--text-success': themeColors.success,
      '--text-warning': themeColors.warning,
      '--text-danger': themeColors.danger,
      '--border-primary': '#e2e8f0',
      '--border-secondary': '#cbd5e1',
      '--border-accent': themeColors.accent,
      '--border-focus': themeColors.accent,
      '--accent-primary': themeColors.accent,
      '--accent-secondary': themeColors.accentLight,
      '--accent-success': themeColors.success,
      '--accent-warning': themeColors.warning,
      '--accent-danger': themeColors.danger,
      '--accent-info': themeColors.info,
      '--shadow-sm': '0 1px 2px 0 rgba(8, 53, 84, 0.08)',
      '--shadow-md': '0 4px 6px -1px rgba(8, 53, 84, 0.1), 0 2px 4px -1px rgba(8, 53, 84, 0.06)',
      '--shadow-lg': '0 10px 15px -3px rgba(8, 53, 84, 0.1), 0 4px 6px -2px rgba(8, 53, 84, 0.05)',
      '--shadow-xl': '0 20px 25px -5px rgba(8, 53, 84, 0.1), 0 10px 10px -5px rgba(8, 53, 84, 0.04)',
      '--shadow-inner': 'inset 0 2px 4px 0 rgba(8, 53, 84, 0.06)',
      '--gradient-primary': themeColors.gradients.primary,
      '--gradient-secondary': themeColors.gradients.accent,
      '--gradient-accent': themeColors.gradients.header,
      '--gradient-warm': 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
      '--gradient-cool': 'linear-gradient(135deg, #083554 0%, #11278C 100%)',
      '--card-bg': themeColors.white,
      '--card-border': '#e2e8f0',
      '--card-hover': l.bgSecondary,
      '--input-bg': themeColors.white,
      '--input-border': '#d1d5db',
      '--input-focus': themeColors.accent,
      '--status-online': themeColors.success,
      '--status-offline': '#6b7280',
      '--status-busy': themeColors.danger,
      '--status-away': themeColors.warning,
    };
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setSystemTheme = () => {
    localStorage.removeItem('theme');
    setTheme(systemPreference);
  };

  const value = {
    theme,
    systemPreference,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: !localStorage.getItem('theme'),
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    getThemeCSSVariables
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
