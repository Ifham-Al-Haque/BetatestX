import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
];

export function getChartTheme(isDark) {
  return {
    grid: isDark ? '#2e3442' : '#f0f0f0',
    axis: isDark ? '#94a3b8' : '#6b7280',
    labelStyle: { color: isDark ? '#f1f5f9' : '#374151' },
    tooltip: {
      backgroundColor: isDark ? '#1a1f2e' : '#ffffff',
      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: isDark
        ? '0 4px 12px rgba(0,0,0,0.4)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      color: isDark ? '#f1f5f9' : '#374151',
    },
    exportBackground: isDark ? '#0f1419' : '#ffffff',
    emptyBg: isDark ? 'var(--surface-overlay)' : '#f9fafb',
    emptyIconBg: isDark ? 'var(--surface-elevated)' : '#e5e7eb',
    emptyText: isDark ? 'var(--text-muted)' : '#6b7280',
  };
}

export function useChartTheme() {
  const { isDark } = useTheme();
  return useMemo(() => getChartTheme(isDark), [isDark]);
}
