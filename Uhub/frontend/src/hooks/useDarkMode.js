import { useTheme } from '../context/ThemeContext';

export const useDarkMode = () => {
  const theme = useTheme();

  return {
    isDark: theme.isDark,
    isLight: theme.isLight,
    theme: theme.theme,
    preference: theme.preference,
    isSystem: theme.isSystem,
    toggle: theme.toggleTheme,
    setLight: theme.setLightTheme,
    setDark: theme.setDarkTheme,
    setSystem: theme.setSystemTheme,
  };
};
