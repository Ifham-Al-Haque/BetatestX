import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Minus,
  Download,
  ExternalLink,
  GitCompare,
  X,
  Focus,
} from 'lucide-react';
import { canonicalServiceName, canonicalDepartmentName } from './chartUtils';
import { downloadChartPng } from './chartExport';
import { formatCurrency, getExpenseAmount } from '../../utils/expenseHelpers';
import { DEPARTMENTS } from '../../config/departments';

const CHART_COLORS = [
  '#2563EB',
  '#0EA5E9',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

const INITIAL_VISIBLE = 6;
const MAX_COMPARE = 2;

function slugify(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function buildServiceSeries(expenses, aggregationMode) {
  const grouped = {};

  expenses.forEach((expense, rowIndex) => {
    if (!expense.service_name || expense.amount_aed == null || expense.amount_aed === '') return;
    if (!expense.date_paid) return;

    const date = new Date(expense.date_paid);
    if (Number.isNaN(date.getTime())) return;

    const key = canonicalServiceName(expense.service_name);
    const amount = getExpenseAmount(expense);
    const isMonthly = aggregationMode === 'monthly';
    const pointKey = isMonthly
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : expense.id != null
        ? `id-${expense.id}`
        : `${date.toISOString().slice(0, 10)}-${rowIndex}`;

    const label = isMonthly
      ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

    if (!grouped[key]) {
      grouped[key] = {
        key,
        displayName: expense.service_name.trim(),
        departments: new Set(),
        points: {},
      };
    }

    if (expense.department) {
      grouped[key].departments.add(canonicalDepartmentName(expense.department));
    }

    if (!grouped[key].points[pointKey]) {
      grouped[key].points[pointKey] = {
        label,
        pointKey,
        total: 0,
        count: 0,
        sortDate: isMonthly
          ? new Date(date.getFullYear(), date.getMonth(), 1).getTime()
          : date.getTime(),
      };
    }

    grouped[key].points[pointKey].total += amount;
    grouped[key].points[pointKey].count += 1;
  });

  return Object.values(grouped)
    .map((service) => {
      const data = Object.values(service.points).sort((a, b) => a.sortDate - b.sortDate);
      const totalSpent = data.reduce((sum, row) => sum + row.total, 0);
      const peak = data.reduce(
        (best, row) => (row.total > best.total ? row : best),
        data[0] || { label: '—', total: 0 }
      );
      const avgPerPoint = data.length ? totalSpent / data.length : 0;
      const transactions = data.reduce((sum, row) => sum + row.count, 0);
      const colorIndex =
        service.key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        CHART_COLORS.length;

      let trendPct = null;
      let trendDirection = 'neutral';
      if (data.length >= 2) {
        const prev = data[data.length - 2].total;
        const last = data[data.length - 1].total;
        if (prev > 0) {
          trendPct = ((last - prev) / prev) * 100;
          trendDirection = trendPct > 1 ? 'up' : trendPct < -1 ? 'down' : 'neutral';
        }
      }

      return {
        key: service.key,
        chartId: `service-trend-${slugify(service.key)}`,
        gradientId: `area-${slugify(service.key)}`,
        displayName: service.displayName,
        departments: Array.from(service.departments),
        color: CHART_COLORS[colorIndex],
        data,
        stats: {
          totalSpent,
          peak,
          avgPerPoint,
          transactions,
          trendPct,
          trendDirection,
          pointCount: data.length,
        },
      };
    })
    .filter((s) => s.data.length > 0)
    .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent);
}

function buildCompareChartData(services) {
  const periodMap = new Map();
  services.forEach((service) => {
    service.data.forEach((row) => {
      if (!periodMap.has(row.label)) {
        periodMap.set(row.label, { label: row.label, sortDate: row.sortDate });
      }
      periodMap.get(row.label)[service.key] = row.total;
    });
  });
  return Array.from(periodMap.values()).sort((a, b) => a.sortDate - b.sortDate);
}

function TrendBadge({ trendPct, direction }) {
  if (trendPct == null) return null;
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const tone =
    direction === 'up'
      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40'
      : direction === 'down'
        ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40'
        : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tone}`}>
      <Icon className="w-3 h-3" />
      {trendPct > 0 ? '+' : ''}
      {trendPct.toFixed(1)}%
    </span>
  );
}

function ServiceTrendChart({ service, aggregationMode, compact = false }) {
  const tickInterval =
    service.data.length > 14 ? Math.ceil(service.data.length / 10) - 1 : service.data.length > 8 ? 1 : 0;

  return (
    <div className={compact ? 'h-14' : 'h-64 sm:h-72'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={service.data}
          margin={
            compact
              ? { top: 4, right: 4, left: 4, bottom: 4 }
              : { top: 12, right: 12, left: 4, bottom: aggregationMode === 'monthly' ? 48 : 32 }
          }
        >
          <defs>
            <linearGradient id={service.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={service.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={service.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {!compact && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} vertical={false} />
          )}
          {!compact && (
            <>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
                interval={tickInterval}
                angle={service.data.length > 6 ? -35 : 0}
                textAnchor={service.data.length > 6 ? 'end' : 'middle'}
                height={service.data.length > 6 ? 52 : 28}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur px-3 py-2 shadow-lg text-sm">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Amount:{' '}
                        <span className="font-bold" style={{ color: service.color }}>
                          {formatCurrency(row.total)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {row.count} transaction{row.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                }}
              />
            </>
          )}
          <Area
            type="monotone"
            dataKey="total"
            stroke={service.color}
            strokeWidth={compact ? 1.5 : 2.5}
            fill={`url(#${service.gradientId})`}
            dot={compact ? false : { r: 3, fill: service.color, strokeWidth: 0 }}
            activeDot={compact ? false : { r: 5, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ServiceCompareChart({ services, aggregationMode }) {
  const data = buildCompareChartData(services);

  return (
    <div id="service-trends-compare" className="h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.35} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            angle={data.length > 6 ? -35 : 0}
            textAnchor={data.length > 6 ? 'end' : 'middle'}
            height={48}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            width={42}
          />
          <Tooltip
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              services.find((s) => s.key === name)?.displayName || name,
            ]}
          />
          <Legend
            formatter={(value) => services.find((s) => s.key === value)?.displayName || value}
          />
          {services.map((service) => (
            <Line
              key={service.key}
              type="monotone"
              dataKey={service.key}
              name={service.key}
              stroke={service.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: service.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 text-center">
        {aggregationMode === 'monthly' ? 'Monthly totals' : 'Per transaction'} · {services.length} services
      </p>
    </div>
  );
}

function ServiceTrendCard({
  service,
  aggregationMode,
  expanded,
  onToggle,
  index,
  isCompareSelected,
  onToggleCompare,
  onExport,
  exportToast,
  focused,
  onFocus,
}) {
  const pointLabel = aggregationMode === 'monthly' ? 'months' : 'points';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
        isCompareSelected
          ? 'border-violet-400 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-900/50'
          : focused
            ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900/40'
            : 'border-gray-200/80 dark:border-gray-700/80'
      } bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-900/50`}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0"
        >
          <div
            className="w-1.5 self-stretch rounded-full shrink-0 hidden sm:block"
            style={{ backgroundColor: service.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: service.color }}
              />
              <h4 className="font-bold text-gray-900 dark:text-white truncate">{service.displayName}</h4>
              <TrendBadge trendPct={service.stats.trendPct} direction={service.stats.trendDirection} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {service.stats.pointCount} {pointLabel} · {service.stats.transactions} transactions
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(service.stats.totalSpent)}
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-2 -mt-1">
        <button
          type="button"
          onClick={onToggleCompare}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            isCompareSelected
              ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          {isCompareSelected ? 'Comparing' : 'Compare'}
        </button>
        <button
          type="button"
          onClick={onFocus}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            focused
              ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Focus className="w-3.5 h-3.5" />
          {focused ? 'Focused' : 'Focus'}
        </button>
        <Link
          to={`/expenses?search=${encodeURIComponent(service.displayName)}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Expenses
        </Link>
      </div>

      {!expanded && (
        <div className="px-4 pb-4">
          <div id={service.chartId}>
            <ServiceTrendChart service={service} aggregationMode={aggregationMode} compact />
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 dark:border-gray-700/80 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  {
                    label: 'Peak',
                    value: service.stats.peak.label,
                    sub: formatCurrency(service.stats.peak.total),
                  },
                  {
                    label: 'Average',
                    value: formatCurrency(Math.round(service.stats.avgPerPoint)),
                    sub: `per ${aggregationMode === 'monthly' ? 'month' : 'point'}`,
                  },
                  { label: 'Transactions', value: service.stats.transactions, sub: 'total' },
                  { label: 'Data points', value: service.stats.pointCount, sub: pointLabel },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="rounded-xl bg-white/80 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/60 px-3 py-2"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
                      {chip.label}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{chip.value}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{chip.sub}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={onExport}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export PNG
                </button>
              </div>

              <div id={service.chartId}>
                <ServiceTrendChart service={service} aggregationMode={aggregationMode} />
              </div>
              {exportToast && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 text-right">{exportToast}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function IndividualServiceTrends({ expenses = [] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('spend');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [aggregationMode, setAggregationMode] = useState('monthly');
  const [showAll, setShowAll] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const [compareKeys, setCompareKeys] = useState([]);
  const [focusedKey, setFocusedKey] = useState(null);
  const [exportToast, setExportToast] = useState('');
  const didAutoExpand = useRef(false);

  const departmentFilteredExpenses = useMemo(() => {
    if (departmentFilter === 'all') return expenses;
    return expenses.filter(
      (e) => canonicalDepartmentName(e.department) === departmentFilter
    );
  }, [expenses, departmentFilter]);

  const allServices = useMemo(
    () => buildServiceSeries(departmentFilteredExpenses, aggregationMode),
    [departmentFilteredExpenses, aggregationMode]
  );

  const filteredServices = useMemo(() => {
    let list = allServices;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.key.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (sortBy === 'recent') {
      list = [...list].sort((a, b) => {
        const aLast = a.data[a.data.length - 1]?.sortDate || 0;
        const bLast = b.data[b.data.length - 1]?.sortDate || 0;
        return bLast - aLast;
      });
    }
    return list;
  }, [allServices, search, sortBy]);

  const visibleServices = useMemo(() => {
    if (focusedKey) {
      const focused = filteredServices.find((s) => s.key === focusedKey);
      return focused ? [focused] : filteredServices.slice(0, INITIAL_VISIBLE);
    }
    return showAll ? filteredServices : filteredServices.slice(0, INITIAL_VISIBLE);
  }, [filteredServices, showAll, focusedKey]);

  const compareServices = useMemo(
    () => allServices.filter((s) => compareKeys.includes(s.key)),
    [allServices, compareKeys]
  );

  const summaryStrip = useMemo(() => {
    const totalSpend = filteredServices.reduce((sum, s) => sum + s.stats.totalSpent, 0);
    const top = filteredServices[0];
    return { totalSpend, count: filteredServices.length, top };
  }, [filteredServices]);

  useEffect(() => {
    if (didAutoExpand.current || !filteredServices.length) return;
    setExpandedKeys(new Set([filteredServices[0].key]));
    didAutoExpand.current = true;
  }, [filteredServices]);

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleCompare = useCallback((key) => {
    setCompareKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_COMPARE) return [prev[1], key];
      return [...prev, key];
    });
  }, []);

  const toggleFocus = useCallback((key) => {
    setFocusedKey((prev) => (prev === key ? null : key));
    setExpandedKeys(new Set([key]));
  }, []);

  const handleExport = async (service) => {
    const ok = await downloadChartPng(service.chartId, slugify(service.displayName));
    setExportToast(ok ? 'Chart exported' : 'Export failed');
    setTimeout(() => setExportToast(''), 2000);
  };

  const expandAllVisible = () => {
    setExpandedKeys(new Set(visibleServices.map((s) => s.key)));
  };

  const collapseAll = () => setExpandedKeys(new Set());

  if (!expenses.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <TrendingUp className="w-14 h-14 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium">No expense data available</p>
        <p className="text-sm mt-1">Add expenses to see individual service trends</p>
      </div>
    );
  }

  if (!allServices.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <BarChart3 className="w-14 h-14 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium">No trend-ready records</p>
        <p className="text-sm mt-1">Expenses need a service name, amount, and date paid</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Individual Service Trends</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Expand cards for full charts · compare up to 2 services · link to Expense Tracker
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Services', value: summaryStrip.count },
          { label: 'Total spend', value: formatCurrency(summaryStrip.totalSpend) },
          {
            label: 'Top service',
            value: summaryStrip.top?.displayName?.slice(0, 18) || '—',
            sub: summaryStrip.top ? formatCurrency(summaryStrip.top.stats.totalSpent) : '',
          },
          { label: 'Compare', value: `${compareKeys.length}/${MAX_COMPARE}` },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{item.value}</p>
            {item.sub && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.sub}</p>
            )}
          </div>
        ))}
      </div>

      {compareServices.length > 0 && (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/40 dark:bg-violet-900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h4 className="font-bold text-gray-900 dark:text-white">Service comparison</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadChartPng('service-trends-compare', 'service-comparison')
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-violet-200 dark:border-violet-700 hover:bg-white/60 dark:hover:bg-gray-800"
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </button>
              <button
                type="button"
                onClick={() => setCompareKeys([])}
                className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 text-gray-500"
                aria-label="Clear comparison"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ServiceCompareChart services={compareServices} aggregationMode={aggregationMode} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
        >
          <option value="spend">Highest spend</option>
          <option value="name">Name A–Z</option>
          <option value="recent">Most recent activity</option>
        </select>
        <div className="inline-flex bg-gray-100 dark:bg-gray-700/60 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setAggregationMode('monthly')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              aggregationMode === 'monthly'
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAggregationMode('transaction')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              aggregationMode === 'transaction'
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            By transaction
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={expandAllVisible}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Expand visible
        </button>
        <button
          type="button"
          onClick={collapseAll}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Collapse all
        </button>
        {focusedKey && (
          <button
            type="button"
            onClick={() => setFocusedKey(null)}
            className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            Exit focus mode
          </button>
        )}
      </div>

      {filteredServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center text-sm text-gray-500">
          No services match your filters
        </div>
      ) : (
        <div className={`grid gap-4 ${focusedKey ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
          {visibleServices.map((service, index) => (
            <ServiceTrendCard
              key={service.key}
              service={service}
              aggregationMode={aggregationMode}
              expanded={expandedKeys.has(service.key)}
              onToggle={() => toggleExpanded(service.key)}
              index={index}
              isCompareSelected={compareKeys.includes(service.key)}
              onToggleCompare={() => toggleCompare(service.key)}
              onExport={() => handleExport(service)}
              exportToast={exportToast}
              focused={focusedKey === service.key}
              onFocus={() => toggleFocus(service.key)}
            />
          ))}
        </div>
      )}

      {!focusedKey && filteredServices.length > INITIAL_VISIBLE && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            {showAll
              ? 'Show top services only'
              : `Show all ${filteredServices.length} services`}
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
