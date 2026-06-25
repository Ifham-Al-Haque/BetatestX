import { motion } from 'framer-motion';
import { Calendar, Clock, Filter, Target, TrendingUp, Zap } from 'lucide-react';
import { DEPARTMENTS } from '../../config/departments';
import { STATUS_OPTIONS } from '../../utils/expenseHelpers';
import {
  ANALYTICS_COMPARISON_OPTIONS,
  ANALYTICS_TIME_RANGES,
} from '../../utils/analyticsHelpers';

const TIME_ICONS = {
  'current-month': Calendar,
  'last-3-months': Clock,
  'last-6-months': Target,
  'last-year': Calendar,
  'all-time': Zap,
};

const COMPARISON_ICONS = {
  none: Filter,
  'previous-period': TrendingUp,
  'year-over-year': Calendar,
};

export default function AnalyticsFiltersPanel({
  filters,
  onFilterChange,
  isExpanded,
  availableYears = [],
}) {
  if (!isExpanded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 overflow-hidden mb-6"
    >
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Time Range
            </label>
            <div className="space-y-1.5">
              {ANALYTICS_TIME_RANGES.map((option) => {
                const Icon = TIME_ICONS[option.value] || Clock;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onFilterChange('timeRange', option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      filters.timeRange === option.value
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Comparison
            </label>
            <div className="space-y-1.5">
              {ANALYTICS_COMPARISON_OPTIONS.map((option) => {
                const Icon = COMPARISON_ICONS[option.value] || TrendingUp;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onFilterChange('comparison', option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      filters.comparison === option.value
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <select
                value={filters.year || 'all'}
                onChange={(e) => onFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                value={filters.department || 'all'}
                onChange={(e) => onFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Service Status
            </label>
            <select
              value={filters.serviceStatus || 'all'}
              onChange={(e) => onFilterChange('serviceStatus', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
