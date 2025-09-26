import React, { createContext, useContext, useEffect, useState } from 'react';

const EnhancedThemeContext = createContext();

export const useEnhancedTheme = () => {
  const context = useContext(EnhancedThemeContext);
  if (!context) {
    throw new Error('useEnhancedTheme must be used within an EnhancedThemeProvider');
  }
  return context;
};

export const EnhancedThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('enhanced-theme');
    return savedTheme ? JSON.parse(savedTheme) : { mode: 'light', variant: 'default' };
  });

  const [systemPreference, setSystemPreference] = useState('light');

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newSystemPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newSystemPreference);
      
      // If user hasn't set a preference, follow system
      if (!localStorage.getItem('enhanced-theme')) {
        setTheme({ mode: newSystemPreference, variant: 'default' });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'light', 'warm', 'cool', 'deep');
    
    // Add current theme classes
    if (theme.mode === 'dark') {
      root.classList.add('dark');
      if (theme.variant !== 'default') {
        root.classList.add(theme.variant);
      }
    } else {
      root.classList.add('light');
    }
    
    root.setAttribute('data-theme', `${theme.mode}-${theme.variant}`);
    
    // Apply enhanced CSS variables
    const cssVars = getEnhancedCSSVariables(theme);
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Save to localStorage
    localStorage.setItem('enhanced-theme', JSON.stringify(theme));
    
    // Add smooth transition class
    root.classList.add('theme-transition');
    
    // Remove transition class after animation
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 400);
  }, [theme]);

  const getEnhancedCSSVariables = (currentTheme) => {
    const { mode, variant } = currentTheme;
    
    if (mode === 'dark') {
      const baseDarkVars = {
        // Enhanced dark mode base colors
        '--bg-primary': '#0a0a0a',
        '--bg-secondary': '#111111',
        '--bg-tertiary': '#1a1a1a',
        '--bg-quaternary': '#222222',
        '--bg-glass': 'rgba(17, 17, 17, 0.8)',
        '--bg-glass-hover': 'rgba(26, 26, 26, 0.9)',
        
        '--text-primary': '#f8fafc',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#94a3b8',
        '--text-accent': '#60a5fa',
        
        '--border-primary': '#374151',
        '--border-secondary': '#4b5563',
        '--border-accent': '#3b82f6',
        
        '--accent-primary': '#3b82f6',
        '--accent-secondary': '#8b5cf6',
        '--accent-success': '#10b981',
        '--accent-warning': '#f59e0b',
        '--accent-danger': '#ef4444',
        
        // Enhanced shadows
        '--shadow-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        
        // Glowing effects
        '--glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        '--glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        '--glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        '--glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        
        // Glassmorphism
        '--glass-bg': 'rgba(255, 255, 255, 0.05)',
        '--glass-border': 'rgba(255, 255, 255, 0.1)',
        '--glass-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        '--glass-backdrop': 'blur(16px)',
        
        // Enhanced gradients
        '--gradient-primary': 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        '--gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        '--gradient-success': 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        '--gradient-warm': 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f59e0b 100%)',
        '--gradient-cool': 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #ec4899 100%)',
      };

      // Apply variant-specific overrides
      if (variant === 'warm') {
        return {
          ...baseDarkVars,
          '--bg-primary': '#0f0a0a',
          '--bg-secondary': '#1a1515',
          '--bg-tertiary': '#2a1f1f',
          '--text-accent': '#fb923c',
          '--accent-primary': '#fb923c',
          '--accent-secondary': '#f97316',
          '--gradient-primary': 'linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #ea580c 100%)',
          '--glow-blue': '0 0 20px rgba(251, 146, 60, 0.3)',
        };
      } else if (variant === 'cool') {
        return {
          ...baseDarkVars,
          '--bg-primary': '#0a0f0a',
          '--bg-secondary': '#151a15',
          '--bg-tertiary': '#1f2a1f',
          '--text-accent': '#22d3ee',
          '--accent-primary': '#22d3ee',
          '--accent-secondary': '#06b6d4',
          '--gradient-primary': 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)',
          '--glow-blue': '0 0 20px rgba(34, 211, 238, 0.3)',
        };
      } else if (variant === 'deep') {
        return {
          ...baseDarkVars,
          '--bg-primary': '#000000',
          '--bg-secondary': '#0a0a0a',
          '--bg-tertiary': '#111111',
          '--bg-quaternary': '#1a1a1a',
          '--text-primary': '#ffffff',
          '--text-secondary': '#e5e7eb',
          '--shadow-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
          '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
          '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
          '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        };
      }

      return baseDarkVars;
    } else {
      // Light mode
      return {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-tertiary': '#f1f5f9',
        '--bg-quaternary': '#e2e8f0',
        '--bg-glass': 'rgba(255, 255, 255, 0.8)',
        '--bg-glass-hover': 'rgba(248, 250, 252, 0.9)',
        
        '--text-primary': '#0f172a',
        '--text-secondary': '#334155',
        '--text-muted': '#64748b',
        '--text-accent': '#3b82f6',
        
        '--border-primary': '#e2e8f0',
        '--border-secondary': '#cbd5e1',
        '--border-accent': '#3b82f6',
        
        '--accent-primary': '#3b82f6',
        '--accent-secondary': '#8b5cf6',
        '--accent-success': '#10b981',
        '--accent-warning': '#f59e0b',
        '--accent-danger': '#ef4444',
        
        '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '--shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        
        '--glow-blue': '0 0 20px rgba(59, 130, 246, 0.2)',
        '--glow-purple': '0 0 20px rgba(139, 92, 246, 0.2)',
        '--glow-green': '0 0 20px rgba(16, 185, 129, 0.2)',
        '--glow-red': '0 0 20px rgba(239, 68, 68, 0.2)',
        
        '--glass-bg': 'rgba(255, 255, 255, 0.8)',
        '--glass-border': 'rgba(255, 255, 255, 0.2)',
        '--glass-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        '--glass-backdrop': 'blur(16px)',
        
        '--gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        '--gradient-accent': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        '--gradient-success': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        '--gradient-warm': 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
        '--gradient-cool': 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
      };
    }
  };

  const setThemeMode = (mode) => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const setThemeVariant = (variant) => {
    setTheme(prev => ({ ...prev, variant }));
  };

  const toggleTheme = () => {
    setTheme(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };

  const setLightTheme = () => setThemeMode('light');
  const setDarkTheme = () => setThemeMode('dark');
  const setSystemTheme = () => {
    localStorage.removeItem('enhanced-theme');
    setTheme({ mode: systemPreference, variant: 'default' });
  };

  const value = {
    theme,
    systemPreference,
    isDark: theme.mode === 'dark',
    isLight: theme.mode === 'light',
    isSystem: !localStorage.getItem('enhanced-theme'),
    currentVariant: theme.variant,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    setThemeMode,
    setThemeVariant,
    getEnhancedCSSVariables
  };

  return (
    <EnhancedThemeContext.Provider value={value}>
      {children}
    </EnhancedThemeContext.Provider>
  );
};
