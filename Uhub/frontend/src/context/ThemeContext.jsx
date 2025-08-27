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
    if (currentTheme === 'dark') {
      return {
        '--bg-primary': '#0f172a',
        '--bg-secondary': '#1e293b',
        '--bg-tertiary': '#334155',
        '--text-primary': '#f8fafc',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#94a3b8',
        '--border-primary': '#475569',
        '--border-secondary': '#64748b',
        '--accent-primary': '#3b82f6',
        '--accent-secondary': '#8b5cf6',
        '--accent-success': '#10b981',
        '--accent-warning': '#f59e0b',
        '--accent-danger': '#ef4444',
        '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        '--gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '--gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        '--gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      };
    } else {
      return {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-tertiary': '#f1f5f9',
        '--text-primary': '#0f172a',
        '--text-secondary': '#334155',
        '--text-muted': '#64748b',
        '--border-primary': '#e2e8f0',
        '--border-secondary': '#cbd5e1',
        '--accent-primary': '#3b82f6',
        '--accent-secondary': '#8b5cf6',
        '--accent-success': '#10b981',
        '--accent-warning': '#f59e0b',
        '--accent-danger': '#ef4444',
        '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        '--gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '--gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        '--gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
