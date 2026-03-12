import React, { createContext, useContext, useEffect, useState } from 'react';

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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transitionDuration = prefersReducedMotion ? 50 : 450;

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

    // Add smooth transition class (scoped in CSS so only theme-relevant props animate)
    if (!prefersReducedMotion) {
      root.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);
      root.classList.add('theme-transition');
      const t = setTimeout(() => {
        root.classList.remove('theme-transition');
      }, transitionDuration);
      return () => clearTimeout(t);
    }
  }, [theme]);

  const getThemeCSSVariables = (currentTheme) => {
    if (currentTheme === 'dark') {
      return {
        // Dark blue theme matching the dashboard screenshot
        '--bg-primary': '#0f1419',           // Dark navy blue for main background
        '--bg-secondary': '#1a1f2e',         // Slightly lighter blue for cards/sections
        '--bg-tertiary': '#242938',          // Even lighter blue for nested elements
        '--bg-quaternary': '#2e3442',        // Lightest blue for hover states
        '--bg-sidebar': '#0f1419',           // Dark navy sidebar background
        '--bg-sidebar-hover': '#1a1f2e',     // Sidebar hover state
        '--bg-sidebar-active': '#242938',    // Active sidebar item
        
        // Clean white text colors matching the screenshot
        '--text-primary': '#ffffff',         // Pure white for main text
        '--text-secondary': '#e2e8f0',       // Light gray for secondary text
        '--text-muted': '#94a3b8',           // Muted gray text
        '--text-accent': '#60a5fa',          // Light blue accent text
        '--text-success': '#34d399',         // Success text (green)
        '--text-warning': '#fbbf24',         // Warning text (yellow)
        '--text-danger': '#f87171',          // Danger text (red)
        
        // Translucent white borders matching the screenshot cards
        '--border-primary': 'rgba(255, 255, 255, 0.2)',       // Translucent white borders
        '--border-secondary': 'rgba(255, 255, 255, 0.1)',     // Lighter translucent borders
        '--border-accent': '#60a5fa',        // Blue accent borders
        '--border-focus': '#3b82f6',         // Focus borders
        
        // Blue accent colors matching the dashboard theme
        '--accent-primary': '#3b82f6',       // Primary blue
        '--accent-secondary': '#6366f1',     // Secondary indigo
        '--accent-success': '#10b981',       // Success emerald
        '--accent-warning': '#f59e0b',       // Warning amber
        '--accent-danger': '#ef4444',        // Danger red
        '--accent-info': '#06b6d4',          // Info cyan
        
        // Enhanced shadows with better depth
        '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        '--shadow-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        
        // Enhanced gradients
        '--gradient-primary': 'linear-gradient(135deg, #1f6feb 0%, #a855f7 100%)',
        '--gradient-secondary': 'linear-gradient(135deg, #238636 0%, #1f6feb 100%)',
        '--gradient-accent': 'linear-gradient(135deg, #58a6ff 0%, #1f6feb 100%)',
        '--gradient-warm': 'linear-gradient(135deg, #f85149 0%, #d29922 100%)',
        '--gradient-cool': 'linear-gradient(135deg, #1f6feb 0%, #238636 100%)',
        
        // Card and surface colors - translucent effect matching screenshot
        '--card-bg': 'rgba(26, 31, 46, 0.7)',        // Translucent dark blue for cards
        '--card-border': 'rgba(255, 255, 255, 0.2)',  // Translucent white borders
        '--card-hover': 'rgba(36, 41, 56, 0.8)',     // Slightly more opaque on hover
        '--input-bg': '#0d1117',
        '--input-border': '#30363d',
        '--input-focus': '#1f6feb',
        
        // Status colors
        '--status-online': '#3fb950',
        '--status-offline': '#8b949e',
        '--status-busy': '#f85149',
        '--status-away': '#d29922',
      };
    } else {
      return {
        // Light mode colors (enhanced for consistency)
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-tertiary': '#f1f5f9',
        '--bg-quaternary': '#e2e8f0',
        '--bg-sidebar': '#f8fafc',
        '--bg-sidebar-hover': '#f1f5f9',
        '--bg-sidebar-active': '#e2e8f0',
        
        '--text-primary': '#0f172a',
        '--text-secondary': '#334155',
        '--text-muted': '#64748b',
        '--text-accent': '#3b82f6',
        '--text-success': '#059669',
        '--text-warning': '#d97706',
        '--text-danger': '#dc2626',
        
        '--border-primary': '#e2e8f0',
        '--border-secondary': '#cbd5e1',
        '--border-accent': '#3b82f6',
        '--border-focus': '#2563eb',
        
        '--accent-primary': '#3b82f6',
        '--accent-secondary': '#8b5cf6',
        '--accent-success': '#10b981',
        '--accent-warning': '#f59e0b',
        '--accent-danger': '#ef4444',
        '--accent-info': '#06b6d4',
        
        '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '--shadow-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        
        '--gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        '--gradient-secondary': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        '--gradient-accent': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        '--gradient-warm': 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
        '--gradient-cool': 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
        
        '--card-bg': '#ffffff',
        '--card-border': '#e2e8f0',
        '--card-hover': '#f8fafc',
        '--input-bg': '#ffffff',
        '--input-border': '#d1d5db',
        '--input-focus': '#3b82f6',
        
        '--status-online': '#10b981',
        '--status-offline': '#6b7280',
        '--status-busy': '#ef4444',
        '--status-away': '#f59e0b',
      };
    }
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
