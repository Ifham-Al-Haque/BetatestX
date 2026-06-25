import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatDeltaPct } from '../../utils/analyticsHelpers';

const COLOR_THEMES = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    icon: 'from-blue-500 to-blue-600',
    label: 'text-blue-700 dark:text-blue-300',
    value: 'text-blue-900 dark:text-white',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    icon: 'from-emerald-500 to-emerald-600',
    label: 'text-emerald-700 dark:text-emerald-300',
    value: 'text-emerald-900 dark:text-white',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    icon: 'from-amber-500 to-amber-600',
    label: 'text-amber-700 dark:text-amber-300',
    value: 'text-amber-900 dark:text-white',
  },
  purple: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800/40',
    icon: 'from-violet-500 to-violet-600',
    label: 'text-violet-700 dark:text-violet-300',
    value: 'text-violet-900 dark:text-white',
  },
};

function DeltaBadge({ delta, comparisonLabel }) {
  if (!delta || delta.pct == null) return null;

  const formatted = formatDeltaPct(delta.pct);
  const isUp = delta.direction === 'up';
  const isDown = delta.direction === 'down';
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const tone = isUp
    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40'
    : isDown
      ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40'
      : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tone}`}>
        <Icon className="w-3 h-3" />
        {formatted}
      </span>
      {comparisonLabel && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">{comparisonLabel}</span>
      )}
    </div>
  );
}

export default function AnalyticsKpiCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  delay = 0,
  delta,
  comparisonLabel,
}) {
  const theme = COLOR_THEMES[color] || COLOR_THEMES.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${theme.icon} shadow-md flex-shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <DeltaBadge delta={delta} comparisonLabel={comparisonLabel} />
      </div>
      <p className={`mt-4 text-sm font-medium ${theme.label}`}>{title}</p>
      <p className={`mt-1 text-2xl sm:text-3xl font-bold tracking-tight ${theme.value}`}>
        {value}
      </p>
    </motion.div>
  );
}
