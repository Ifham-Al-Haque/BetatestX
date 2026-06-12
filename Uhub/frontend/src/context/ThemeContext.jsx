import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

const VALID_PREFERENCES = ['light', 'dark', 'system'];

const getSystemPreference = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const readStoredPreference = () => {
  const saved = localStorage.getItem('theme');
  return VALID_PREFERENCES.includes(saved) ? saved : 'system';
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState(readStoredPreference);
  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  const resolvedTheme = preference === 'system' ? systemPreference : preference;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const transitionDuration = prefersReducedMotion ? 50 : 450;

    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-theme-preference', preference);
    localStorage.setItem('theme', preference);

    if (!prefersReducedMotion) {
      root.style.setProperty('--theme-transition-duration', `${transitionDuration}ms`);
      root.classList.add('theme-transition');
      const timer = setTimeout(() => root.classList.remove('theme-transition'), transitionDuration);
      return () => clearTimeout(timer);
    }
  }, [isDark, resolvedTheme, preference]);

  const setThemePreference = (next) => {
    if (VALID_PREFERENCES.includes(next)) {
      setPreference(next);
    }
  };

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      preference,
      systemPreference,
      isDark,
      isLight: !isDark,
      isSystem: preference === 'system',
      toggleTheme: () => setPreference(isDark ? 'light' : 'dark'),
      setLightTheme: () => setPreference('light'),
      setDarkTheme: () => setPreference('dark'),
      setSystemTheme: () => setPreference('system'),
      setThemePreference,
    }),
    [resolvedTheme, preference, systemPreference, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
