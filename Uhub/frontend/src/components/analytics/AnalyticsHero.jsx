import { Link } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  ExternalLink,
  List,
  RefreshCw,
} from 'lucide-react';
import { ANALYTICS_TIME_RANGES } from '../../utils/analyticsHelpers';

export default function AnalyticsHero({
  timeRange,
  onTimeRangeChange,
  onResetFilters,
  onExport,
  exportDisabled,
}) {
  const periodLabel =
    ANALYTICS_TIME_RANGES.find((r) => r.value === timeRange)?.label || 'All Time';

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <p className="text-emerald-100 text-sm font-medium mb-1">Finance</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-emerald-50/90 text-base max-w-xl">
            Spending insights, service trends, and cash flow — {periodLabel.toLowerCase()} view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-colors"
          >
            <List className="w-4 h-4" />
            Expenses
          </Link>
          <Link
            to="/payment-calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ANALYTICS_TIME_RANGES.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTimeRangeChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === opt.value
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-emerald-100/80 text-xs">
        <BarChart3 className="w-3.5 h-3.5" />
        <span>Linked with Expense Tracker and Payment Calendar</span>
        <ExternalLink className="w-3 h-3 opacity-60" />
      </div>
    </div>
  );
}
