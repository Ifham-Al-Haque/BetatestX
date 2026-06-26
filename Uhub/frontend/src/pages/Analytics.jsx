import React, { useMemo, useState, useEffect, useRef, useCallback } from "react"; // Analytics component with real expense data
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Shield, X,
  BarChart3, ArrowLeft, PieChart as PieChartIcon,
  Filter, Download, RefreshCw, ChevronDown, ChevronUp,
  Clock, Target, Zap, Star
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAllExpenses } from "../hooks/useApi";
import { usePaymentEvents } from "../hooks/usePaymentEvents";
import LoadingSpinner from "../components/LoadingSpinner";
import AnalyticsHero from "../components/analytics/AnalyticsHero";
import AnalyticsKpiCard from "../components/analytics/AnalyticsKpiCard";
import CashFlowSummary from "../components/analytics/CashFlowSummary";
import AnalyticsFiltersPanel from "../components/analytics/AnalyticsFiltersPanel";
import IndividualServiceTrends from "../components/analytics/IndividualServiceTrends";
import MissingBillingPeriodPanel from "../components/analytics/MissingBillingPeriodPanel";
import { downloadChartPng } from "../components/analytics/chartExport";
import { canonicalServiceName, normalizeServiceLabel, parseAmountValue, canonicalDepartmentName, DEPARTMENT_CHART_COLORS } from "../components/analytics/chartUtils";
import { getDepartmentLabel } from "../config/departments";
import {
  DEFAULT_ANALYTICS_FILTERS,
  computeAnalyticsWithComparison,
  computeCashFlowSummary,
  aggregateExpensesByMonth,
  getBillingPeriodMonthKey,
  filterExpensesForMonthlyTrend,
  countExpensesMissingBillingPeriod,
  getExpensesMissingBillingPeriod,
} from "../utils/analyticsHelpers";
import { exportExpensesCsv, formatCurrency, getExpenseAmount } from "../utils/expenseHelpers";

// Enhanced color scheme for charts with gradients
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
const SERVICE_DISTRIBUTION_COLORS = [
  '#2563EB', // blue
  '#0EA5E9', // sky
  '#10B981', // emerald
  '#22C55E', // green
  '#A855F7', // purple
  '#F59E0B', // amber
  '#F97316', // orange
  '#EC4899' // pink
];
const GRADIENT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

// Filter options
const FILTER_OPTIONS = {
  timeRange: [
    { value: 'current-month', label: 'Current Month', icon: Calendar },
    { value: 'last-3-months', label: 'Last 3 Months', icon: Clock },
    { value: 'last-6-months', label: 'Last 6 Months', icon: Target },
    { value: 'last-year', label: 'Last Year', icon: Calendar },
    { value: 'all-time', label: 'All Time', icon: Zap }
  ],
  comparison: [
    { value: 'none', label: 'No Comparison', icon: BarChart3 },
    { value: 'previous-period', label: 'Previous Period', icon: TrendingUp },
    { value: 'year-over-year', label: 'Year over Year', icon: Star }
  ]
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="uhub-card-glass p-4 shadow-uhub-lg">
        <p className="font-bold text-content-primary text-lg mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm font-medium text-content-secondary">
              {entry.name}:{' '}
              <span className="font-bold text-content-accent">
                {entry.value?.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Enhanced Animated Metric Card Component
const AnimatedMetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  delay = 0,
  formatValue = (val) => val.toLocaleString('en-US')
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    blue: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      iconBg: 'from-blue-500 to-blue-600',
      text: 'text-blue-600',
      textBold: 'text-blue-900',
      dot: 'bg-blue-500',
      shadow: 'shadow-blue-200/50'
    },
    green: {
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      iconBg: 'from-green-500 to-green-600',
      text: 'text-green-600',
      textBold: 'text-green-900',
      dot: 'bg-green-500',
      shadow: 'shadow-green-200/50'
    },
    yellow: {
      bg: 'from-yellow-50 to-yellow-100',
      border: 'border-yellow-200',
      iconBg: 'from-yellow-500 to-yellow-600',
      text: 'text-yellow-600',
      textBold: 'text-yellow-900',
      dot: 'bg-yellow-500',
      shadow: 'shadow-yellow-200/50'
    },
    purple: {
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      iconBg: 'from-purple-500 to-purple-600',
      text: 'text-purple-600',
      textBold: 'text-purple-900',
      dot: 'bg-purple-500',
      shadow: 'shadow-purple-200/50'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Animate number counting
  useEffect(() => {
    // Extract numeric value from string or use direct value
    let numericValue;
    if (typeof value === 'string') {
      // Remove AED prefix and extract number
      const cleaned = value.replace(/AED\s*/i, '').replace(/,/g, '');
      numericValue = parseFloat(cleaned);
    } else {
      numericValue = value;
    }

    if (isNaN(numericValue) || numericValue === 0) {
      setDisplayValue(numericValue || 0);
      return;
    }

    const duration = 1500; // Animation duration in ms
    const steps = 60; // Number of animation steps
    const increment = numericValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextValue = Math.min(increment * currentStep, numericValue);
      setDisplayValue(nextValue);

      if (currentStep >= steps) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  // Format the display value
  const formattedDisplay = (() => {
    if (typeof value === 'string' && value.includes('AED')) {
      return `AED ${formatValue(displayValue)}`;
    }
    return formatValue(displayValue);
  })();

  // Calculate responsive font size based on content length
  const getFontSize = () => {
    const length = formattedDisplay.length;
    if (length <= 10) return 'clamp(1.75rem, 5vw, 2.25rem)'; // Large for short numbers
    if (length <= 15) return 'clamp(1.5rem, 4.5vw, 2rem)';   // Medium
    if (length <= 20) return 'clamp(1.25rem, 4vw, 1.75rem)'; // Smaller
    return 'clamp(1rem, 3.5vw, 1.5rem)';                      // Smallest for very long numbers
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative bg-gradient-to-br ${colors.bg} p-6 rounded-2xl 
        border ${colors.border} 
        shadow-lg hover:shadow-2xl
        transition-all duration-300 ease-out
        overflow-hidden
        group cursor-pointer
        min-h-[140px]
      `}
    >
      {/* Animated background gradient on hover */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        initial={false}
        animate={{ opacity: isHovered ? 0.3 : 0 }}
      />
      
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '200%' : '-100%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          {/* Icon with enhanced animation */}
          <motion.div
            className={`p-3 bg-gradient-to-r ${colors.iconBg} rounded-xl shadow-lg flex-shrink-0`}
            whileHover={prefersReducedMotion ? { scale: 1.03 } : {
              rotate: [0, -10, 10, -10, 0],
              scale: 1.1
            }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.5 }}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
          
          {/* Enhanced pulse indicator */}
          <motion.div 
            className={`${colors.dot} rounded-full flex-shrink-0`}
            initial={{ width: 12, height: 12 }}
            animate={prefersReducedMotion ? { width: 12, height: 12, opacity: 0.9 } : { 
              width: [12, 16, 12],
              height: [12, 16, 12],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: prefersReducedMotion ? 0 : Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Title */}
        <motion.p 
          className={`text-sm font-medium ${colors.text} mb-2`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.2 }}
        >
          {title}
        </motion.p>
        
        {/* Value with responsive font size */}
        <motion.div
          className="w-full overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, type: "spring" }}
        >
          <p 
            className={`font-bold ${colors.textBold} leading-tight`}
            style={{
              fontSize: getFontSize(),
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.2',
              maxWidth: '100%',
              whiteSpace: 'normal'
            }}
            title={formattedDisplay}
          >
            {formattedDisplay}
          </p>
        </motion.div>
      </div>

      {/* Decorative corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${colors.bg} opacity-20 rounded-bl-full`} />
    </motion.div>
  );
};

// Enhanced Filter Component
const AnalyticsFilter = ({ filters, onFilterChange, isExpanded, onToggle, availableYears = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: isExpanded ? 'auto' : 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
    >
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Clock className="w-4 h-4 inline mr-2" />
              Time Range
            </label>
            <div className="space-y-2">
              {FILTER_OPTIONS.timeRange.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange('timeRange', option.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      filters.timeRange === option.value
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Year
            </label>
            <select
              value={filters.year || 'all'}
              onChange={(e) => onFilterChange('year', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Comparison Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Comparison
            </label>
            <div className="space-y-2">
              {FILTER_OPTIONS.comparison.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange('comparison', option.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      filters.comparison === option.value
                        ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ChartEmptyState = ({ title, subtitle, icon: Icon = BarChart3 }) => (
  <div className="h-96 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
    </div>
  </div>
);

const OVERVIEW_ICON_STYLES = {
  purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
  green: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
  orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',
  pink: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400',
  blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
};

const OverviewSectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const OverviewChartCard = ({
  title,
  subtitle,
  icon: Icon,
  iconTone = 'blue',
  exportContainerId,
  exportFileName,
  onExport,
  delay = 0,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-900/80 p-6 rounded-2xl shadow-lg border border-gray-200/70 dark:border-gray-700/70 hover:shadow-xl transition-shadow duration-300"
  >
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${OVERVIEW_ICON_STYLES[iconTone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {exportContainerId && onExport && (
        <button
          type="button"
          onClick={() => onExport(exportContainerId, exportFileName)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          PNG
        </button>
      )}
    </div>
    <div id={exportContainerId}>{children}</div>
  </motion.div>
);

const OVERVIEW_QUICK_LINKS = [
  {
    tab: 'breakdown',
    label: 'Service Breakdown',
    description: 'Top services & department trends',
    icon: BarChart3,
    tone: 'from-blue-500 to-indigo-600',
  },
  {
    tab: 'distribution',
    label: 'Distribution',
    description: 'Share of spend & service trends',
    icon: PieChartIcon,
    tone: 'from-emerald-500 to-teal-600',
  },
  {
    tab: 'monthly-breakdown',
    label: 'Monthly Breakdown',
    description: 'Per-service monthly bars & invoices',
    icon: Calendar,
    tone: 'from-violet-500 to-purple-600',
  },
];

const OverviewQuickLinks = ({ onNavigate }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {OVERVIEW_QUICK_LINKS.map((link, index) => {
      const Icon = link.icon;
      return (
        <motion.button
          key={link.tab}
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.05 }}
          onClick={() => onNavigate(link.tab)}
          className="group text-left rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
        >
          <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${link.tone} text-white mb-3`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {link.label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{link.description}</p>
        </motion.button>
      );
    })}
  </div>
);

// Monthly Breakdown Charts Component
const MonthlyBreakdownCharts = ({ expenses }) => {
  const [expandedService, setExpandedService] = useState(null);
  const [zoomedMonth, setZoomedMonth] = useState(null);
  const [zoomedService, setZoomedService] = useState(null);
  const [hoveredBarKey, setHoveredBarKey] = useState(null);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const parseMonthKey = (monthStr) => {
    const [month, year] = monthStr.split(' ');
    const monthIndex = monthNames.indexOf(month);
    const fullYear = 2000 + parseInt(year, 10);
    return new Date(fullYear, monthIndex);
  };

  const getServiceGradientId = (serviceName) =>
    `monthly-bar-gradient-${String(serviceName || 'service').replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  const handleServiceClick = (serviceName) => {
    setExpandedService(expandedService === serviceName ? null : serviceName);
    setZoomedMonth(null);
    setZoomedService(null);
  };

  const handleMonthClick = (month, service) => {
    if (zoomedMonth === month && zoomedService === service.service_name) {
      // If already zoomed, zoom out
      setZoomedMonth(null);
      setZoomedService(null);
    } else {
      // Zoom in to the clicked month
      setZoomedMonth(month);
      setZoomedService(service.service_name);
    }
  };

  // Generate services data from real expense data
  const services = useMemo(() => {
    if (!expenses.length) return [];

    const serviceMap = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed != null && expense.amount_aed !== '' && expense.date_paid) {
        const service = canonicalServiceName(expense.service_name);
        
        const date = new Date(expense.date_paid);
        // Ensure consistent month key format: "MMM YY" (e.g., "Jan 24")
        const monthKey = `${date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`;
        
        if (!serviceMap[service]) {
          serviceMap[service] = {
            id: Date.now() + Math.random(), // Generate unique ID
            service_name: service,
            category: expense.department || 'Uncategorized',
            service_status: expense.service_status || 'Active',
            monthly_spending: {},
            transactions: 0
          };
        }
        
        if (!serviceMap[service].monthly_spending[monthKey]) {
          serviceMap[service].monthly_spending[monthKey] = 0;
        }
        serviceMap[service].monthly_spending[monthKey] += parseFloat(expense.amount_aed) || 0;
        serviceMap[service].transactions += 1;
      }
    });

    // Sort monthly spending chronologically for each service
    Object.values(serviceMap).forEach(service => {
      const sortedMonths = Object.entries(service.monthly_spending)
        .sort(([monthA], [monthB]) => parseMonthKey(monthA) - parseMonthKey(monthB));
      
      // Rebuild monthly_spending object with sorted order
      const sortedSpending = {};
      sortedMonths.forEach(([month, amount]) => {
        sortedSpending[month] = amount;
      });
      service.monthly_spending = sortedSpending;
      service.totalSpent = Object.values(sortedSpending).reduce((sum, amount) => sum + (amount || 0), 0);
      service.activeMonths = Object.keys(sortedSpending).length;
    });

    return Object.values(serviceMap).sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  }, [expenses]);

  const paymentDetailsMap = useMemo(() => {
    if (!expenses.length) return {};

    const detailsMap = {};
    expenses.forEach((expense) => {
      if (!expense.date_paid || expense.amount_aed == null || expense.amount_aed === '') return;

      const normalizedService = canonicalServiceName(expense.service_name || '');
      if (!normalizedService) return;

      const expenseDate = new Date(expense.date_paid);
      if (Number.isNaN(expenseDate.getTime())) return;

      const monthKey = `${expenseDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`;
      const key = `${normalizedService}__${monthKey}`;
      if (!detailsMap[key]) detailsMap[key] = [];

      detailsMap[key].push({
        payment_date: expense.date_paid,
        due_date: expense.invoice_due_date || expense.date_paid,
        invoice_date: expense.invoice_generation_date || expense.date_paid,
        amount: parseFloat(expense.amount_aed) || 0,
        invoice_number: expense.invoice_number || `INV-${expense.id}`
      });
    });

    return detailsMap;
  }, [expenses]);

  const getPaymentDetails = (serviceName, month) => {
    return paymentDetailsMap[`${serviceName}__${month}`] || [];
  };

  return (
    <div className="space-y-8">
      {services.map((service, serviceIndex) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: serviceIndex * 0.03 }}
          className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* Service Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[serviceIndex % COLORS.length] }}></div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {service.service_name}
              </h3>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                {service.category || 'Uncategorized'}
              </span>
            </div>
            <button
              onClick={() => handleServiceClick(service.service_name)}
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-2.5 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
            >
              {expandedService === service.service_name ? 'Collapse' : 'Expand'}
              {expandedService === service.service_name ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Service Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                AED {(service.totalSpent || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Months</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {service.activeMonths}
              </p>
            </div>
            <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {service.transactions}
              </p>
            </div>
            <div className="bg-white/90 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {service.service_status}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown Chart */}
          <AnimatePresence initial={false}>
          {expandedService === service.service_name && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="space-y-6 overflow-hidden"
            >
              <div className="h-80 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(service.monthly_spending || {})
                      .map(([month, amount]) => ({
                        month,
                        amount: amount || 0
                      }))
                      .sort((a, b) => parseMonthKey(a.month) - parseMonthKey(b.month))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id={getServiceGradientId(service.service_name)} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[serviceIndex % COLORS.length]} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={COLORS[(serviceIndex + 1) % COLORS.length]} stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#D1D5DB' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#D1D5DB' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800 dark:text-white">{label}</p>
                              <p className="text-sm text-blue-600">
                                AED {payload[0].value?.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                     <Bar
                       dataKey="amount"
                       fill={`url(#${getServiceGradientId(service.service_name)})`}
                       onClick={(data) => handleMonthClick(data.month, service)}
                       onMouseEnter={(data) => setHoveredBarKey(`${service.service_name}__${data.month}`)}
                       onMouseLeave={() => setHoveredBarKey(null)}
                       style={{ cursor: 'pointer' }}
                       radius={[6, 6, 0, 0]}
                       animationDuration={650}
                       animationEasing="ease-out"
                     >
                      {Object.entries(service.monthly_spending || {})
                        .sort(([monthA], [monthB]) => parseMonthKey(monthA) - parseMonthKey(monthB))
                        .map(([month]) => {
                          const isHovered = hoveredBarKey === `${service.service_name}__${month}`;
                          return (
                            <Cell
                              key={`${service.service_name}-${month}`}
                              fillOpacity={hoveredBarKey && !isHovered ? 0.45 : 1}
                              stroke={isHovered ? '#1D4ED8' : 'none'}
                              strokeWidth={isHovered ? 1.5 : 0}
                            />
                          );
                        })}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
                             </div>

               {/* Zoomed Month View */}
               {zoomedMonth && zoomedService === service.service_name && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700"
                 >
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                         {zoomedMonth} - {service.service_name}
                       </h4>
                       <p className="text-blue-700 dark:text-blue-300">
                         Detailed breakdown for this month
                       </p>
                     </div>
                     <button
                       onClick={() => {
                         setZoomedMonth(null);
                         setZoomedService(null);
                       }}
                       className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                     >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   </div>

                   {/* Month Statistics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                       <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Amount</p>
                       <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                         AED {service.monthly_spending[zoomedMonth]?.toLocaleString()}
                       </p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                       <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Service Category</p>
                       <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                         {service.category || 'Uncategorized'}
                       </p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                       <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Service Status</p>
                       <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                         {service.service_status}
                       </p>
                     </div>
                   </div>

                   {/* Payment Details */}
                   <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 overflow-hidden">
                     <div className="bg-blue-50 dark:bg-blue-900 px-4 py-3 border-b border-blue-200 dark:border-blue-600">
                       <h5 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                         Payment Details for {zoomedMonth}
                       </h5>
                     </div>
                     <div className="p-4">
                       {(() => {
                         const paymentDetails = getPaymentDetails(service.service_name, zoomedMonth);
                         if (paymentDetails.length > 0) {
                           return (
                             <div className="space-y-4">
                               {paymentDetails.map((payment, index) => (
                                 <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice #</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">{payment.invoice_number}</p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Amount</p>
                                       <p className="font-semibold text-blue-600 dark:text-blue-400">
                                         AED {payment.amount?.toLocaleString()}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice Date</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">
                                         {new Date(payment.invoice_date).toLocaleDateString()}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Due Date</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">
                                         {new Date(payment.due_date).toLocaleDateString()}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Payment Date</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">
                                         {new Date(payment.payment_date).toLocaleDateString()}
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           );
                         } else {
                           return (
                             <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                               <div className="w-16 h-16 mx-auto mb-4 text-blue-300 dark:text-blue-600">
                                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                 </svg>
                               </div>
                               <p className="text-lg font-medium">No payment details available</p>
                               <p className="text-sm mt-1">Add payment information to see detailed breakdown</p>
                             </div>
                           );
                         }
                       })()}
                     </div>
                   </div>
                 </motion.div>
               )}

               {/* Monthly Details */}
               <div className="space-y-3">
                {Object.entries(service.monthly_spending || {})
                  .sort(([monthA], [monthB]) => parseMonthKey(monthA) - parseMonthKey(monthB))
                  .map(([month, amount]) => {
                  const paymentDetails = getPaymentDetails(service.service_name, month);
                  const isZoomed = zoomedMonth === month && zoomedService === service.service_name;
                  
                  return (
                    <div key={month} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">
                      <div 
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                          isZoomed ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500 shadow-inner' : ''
                        }`}
                        onClick={() => handleMonthClick(month, service)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {month}
                            </span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              AED {amount?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {paymentDetails.length} payment{paymentDetails.length !== 1 ? 's' : ''}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isZoomed 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' 
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {isZoomed ? 'Zoomed' : 'Click to zoom'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

// Service Breakdown Bar Chart Component
const ServiceBreakdownChart = ({ expenses }) => {
  const [selectedService, setSelectedService] = useState(null);

  const serviceData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by service and calculate totals
    const serviceStats = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed != null && expense.amount_aed !== '') {
        const service = canonicalServiceName(expense.service_name);
        
        if (!serviceStats[service]) {
          serviceStats[service] = {
            total: 0,
            count: 0,
            months: new Set()
          };
        }
        serviceStats[service].total += parseFloat(expense.amount_aed) || 0;
        serviceStats[service].count += 1;
        
        if (expense.date_paid) {
          const date = new Date(expense.date_paid);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          serviceStats[service].months.add(monthKey);
        }
      }
    });

    // Convert to array format
    const result = Object.entries(serviceStats).map(([service, stats], index) => ({
      service,
      shortService: service.length > 28 ? `${service.slice(0, 28)}...` : service,
      total: stats.total,
      count: stats.count,
      months: stats.months.size,
      color: COLORS[index % COLORS.length]
    }));

    const sorted = result
      .filter(item => item.total > 0) // Only show services with spending
      .sort((a, b) => b.total - a.total);

    // Keep the chart readable: top services + optional "Others".
    const top = sorted.slice(0, 10);
    const rest = sorted.slice(10);
    if (rest.length > 0) {
      top.push({
        service: `Others (${rest.length} services)`,
        shortService: `Others (${rest.length})`,
        total: rest.reduce((sum, item) => sum + item.total, 0),
        count: rest.reduce((sum, item) => sum + item.count, 0),
        months: Math.max(...rest.map((item) => item.months), 0),
        color: '#94A3B8'
      });
    }
    return top;
  }, [expenses]);

  useEffect(() => {
    if (!serviceData.length) {
      setSelectedService(null);
      return;
    }

    const hasSelection = serviceData.some((item) => item.service === selectedService);
    if (!hasSelection && selectedService !== null) {
      setSelectedService(null);
    }
  }, [serviceData, selectedService]);

  const barChartHeight = Math.min(480, Math.max(280, serviceData.length * 46));

  const selectedServiceMonthlyData = useMemo(() => {
    if (!selectedService || !expenses?.length || selectedService.startsWith('Others (')) {
      return [];
    }

    const monthlyTotals = {};
    expenses.forEach((expense) => {
      if (!expense.service_name || expense.amount_aed == null || expense.amount_aed === '') {
        return;
      }

      const normalizedService = canonicalServiceName(expense.service_name);
      if (normalizedService !== selectedService) {
        return;
      }

      const rawDate = expense.date_paid || expense.date || expense.created_at;
      if (!rawDate) return;

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { total: 0, transactions: 0 };
      }
      monthlyTotals[monthKey].total += parseFloat(expense.amount_aed) || 0;
      monthlyTotals[monthKey].transactions += 1;
    });

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, stats]) => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit'
        });
        return { monthKey, monthLabel, total: stats.total, transactions: stats.transactions };
      });
  }, [expenses, selectedService]);

  const handleServiceClick = (entry) => {
    if (!entry?.service || entry.service.startsWith('Others (')) {
      return;
    }
    setSelectedService(entry.service);
  };

  if (!expenses || expenses.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No expense data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some expenses to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/60 dark:bg-gray-900/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Top spending services ({serviceData.length})
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click a bar to drill down
          </p>
        </div>
        <div style={{ height: barChartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={serviceData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          barCategoryGap={12}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
            </linearGradient>
            <filter id="barShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15"/>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`}
            tick={{ 
              fontSize: 11,
              fill: '#6B7280',
              fontWeight: '500'
            }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
          />
          <YAxis
            type="category"
            dataKey="shortService"
            width={220}
            tick={{ 
              fontSize: 12,
              fill: '#374151',
              fontWeight: '500'
            }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickMargin={8}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 border border-gray-200/60 dark:border-gray-600/60 rounded-xl shadow-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: data.color }}
                      ></div>
                      <p className="font-bold text-gray-900 dark:text-white text-base">{data.service}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Total:</span> AED {data.total.toLocaleString()}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-semibold">Records:</span> {data.count} transactions
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-semibold">Months:</span> {data.months} months
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="total"
            radius={[0, 6, 6, 0]}
            stroke="#fff"
            strokeWidth={2}
            filter="url(#barShadow)"
            animationDuration={500}
            onClick={handleServiceClick}
            cursor="pointer"
          >
            {serviceData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className={`hover:opacity-80 transition-opacity duration-200 ${
                  selectedService === entry.service ? 'opacity-100' : 'opacity-90'
                }`}
                stroke={selectedService === entry.service ? '#1E293B' : '#FFFFFF'}
                strokeWidth={selectedService === entry.service ? 3 : 2}
              />
            ))}
          </Bar>
        </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {selectedService ? `${selectedService} — monthly trend` : 'Monthly trend drill-down'}
            </p>
            {selectedService && (
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  AED total
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Transactions
                </span>
              </div>
            )}
          </div>
          {selectedService && (
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="self-start inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
        {selectedServiceMonthlyData.length ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedServiceMonthlyData} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.25} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                  axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                  tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                />
                <YAxis
                  yAxisId="amount"
                  tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                  axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                  tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                />
                <YAxis
                  yAxisId="transactions"
                  orientation="right"
                  tickFormatter={(value) => `${value}`}
                  tick={{ fontSize: 11, fill: '#059669', fontWeight: 600 }}
                  axisLine={{ stroke: '#10B981', strokeWidth: 1 }}
                  tickLine={{ stroke: '#10B981', strokeWidth: 1 }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Total') return [`AED ${Number(value).toLocaleString()}`, 'Total'];
                    return [Number(value).toLocaleString(), 'Transactions'];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  yAxisId="amount"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  name="Transactions"
                  yAxisId="transactions"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 2, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
              {selectedService
                ? 'No monthly history available for this service.'
                : 'Select a service bar above to view its monthly spending trend.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};



// Service Distribution Pie Chart Component
const ServiceDistributionChart = ({ expenses }) => {
  const [activeSliceIndex, setActiveSliceIndex] = useState(null);
  const legendContainerRef = useRef(null);

  const pieData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by service and calculate totals
    const serviceStats = {};
    expenses.forEach((expense) => {
      const rawService = expense.service_name || expense.service || expense.category || 'Unknown Service';
      const service = canonicalServiceName(rawService);
      const amount = parseAmountValue(
        expense.amount_aed ?? expense.amount ?? expense.value ?? expense.cost ?? 0
      );

      if (!service || amount <= 0) return;

      if (!serviceStats[service]) {
        serviceStats[service] = {
          total: 0,
          category: expense.department || 'Uncategorized'
        };
      }
      serviceStats[service].total += amount;
    });

    const servicesWithSpending = Object.entries(serviceStats)
      .map(([name, stats]) => ({
        name,
        value: stats.total,
        category: stats.category
      }))
      .filter((service) => service.value > 0)
      .sort((a, b) => b.value - a.value);

    const TOP_SLICES = 7;
    const topServices = servicesWithSpending.slice(0, TOP_SLICES);
    const remainingServices = servicesWithSpending.slice(TOP_SLICES);
    const othersTotal = remainingServices.reduce((sum, item) => sum + item.value, 0);

    const merged = othersTotal > 0
      ? [
          ...topServices,
          {
            name: 'OTHERS',
            value: othersTotal,
            category: `${remainingServices.length} services`
          }
        ]
      : topServices;

    const totalSpending = merged.reduce((sum, service) => sum + service.value, 0);

    return merged.map((service, index) => ({
      ...service,
      percentage: totalSpending > 0 ? ((service.value / totalSpending) * 100).toFixed(1) : '0.0',
      color: SERVICE_DISTRIBUTION_COLORS[index % SERVICE_DISTRIBUTION_COLORS.length]
    }));
  }, [expenses]);

  const totalSpending = useMemo(
    () => pieData.reduce((sum, item) => sum + item.value, 0),
    [pieData]
  );

  const leadingService = pieData[0] || null;
  const highlightedService =
    activeSliceIndex != null && pieData[activeSliceIndex] ? pieData[activeSliceIndex] : leadingService;
  const totalDisplayedServices = pieData.length;

  useEffect(() => {
    if (!legendContainerRef.current) return;
    legendContainerRef.current.scrollTop = 0;
  }, [pieData]);

  if (!expenses || expenses.length === 0) {
    return <ChartEmptyState title="No expense data available" subtitle="Add some expenses to see distribution" icon={PieChartIcon} />;
  }

  return (
    <div className="min-h-[460px] bg-gradient-to-br from-white via-green-50/40 to-emerald-100/50 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/30 rounded-2xl p-5 md:p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-start gap-6 h-full">
        {/* Pie Chart */}
        <div className="flex-1 lg:basis-[62%] relative h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
              <defs>
                <filter id="pieGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="pieShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={110}
                innerRadius={58}
                fill="#8884d8"
                dataKey="value"
                minAngle={3}
                paddingAngle={1}
                stroke="#fff"
                strokeWidth={3}
                filter="url(#pieShadow)"
                onMouseEnter={(_, index) => setActiveSliceIndex(index)}
                onMouseLeave={() => setActiveSliceIndex(null)}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={activeSliceIndex === index ? 4 : 2}
                    fillOpacity={activeSliceIndex == null || activeSliceIndex === index ? 1 : 0.35}
                    className="transition-all duration-200"
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 border border-gray-200/60 dark:border-gray-600/60 rounded-xl shadow-2xl">
                        <div className="flex items-center space-x-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm" 
                            style={{ backgroundColor: data.color }}
                          ></div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">{data.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Amount:</span> AED {data.value.toLocaleString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-semibold">Percentage:</span> {data.percentage}%
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-semibold">Category:</span> {data.category}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="w-full lg:w-72 lg:pl-2 mt-2 lg:mt-0 flex flex-col self-stretch">
          <div className="mb-3 rounded-xl border border-emerald-200/80 dark:border-emerald-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur px-3 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
              Spending Insight
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              AED {Math.round(totalSpending).toLocaleString()}
            </p>
            {highlightedService && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                {activeSliceIndex != null ? 'Focus:' : 'Top Service:'} {highlightedService.name} ({highlightedService.percentage}%)
              </p>
            )}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {totalDisplayedServices} categories shown
            </p>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Top Services</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Share of total</p>
          </div>
          <div
            ref={legendContainerRef}
            className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1"
          >
            {pieData.map((entry, index) => (
              <div
                key={`legend-${index}`}
                onMouseEnter={() => setActiveSliceIndex(index)}
                onMouseLeave={() => setActiveSliceIndex(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  activeSliceIndex === index
                    ? 'border-emerald-300 dark:border-emerald-600 bg-white dark:bg-gray-900/70 shadow-sm ring-1 ring-emerald-200/80 dark:ring-emerald-700/50'
                    : 'border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900/60'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className={`text-xs w-5 font-semibold mt-0.5 ${
                    activeSliceIndex === index ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>{index + 1}</span>
                  <div 
                    className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0 mt-1" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {entry.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{entry.percentage}%</span>
                      <span className="text-gray-800 dark:text-gray-200 font-semibold">
                        AED {Math.round(entry.value).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-700/80 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(Number(entry.percentage), 100)}%`, backgroundColor: entry.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Monthly Expense Trend Chart Component
const MonthlyExpenseTrendChart = ({ data, skippedCount = 0, onReviewExcluded, hideTitle = false }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthBreakdown, setMonthBreakdown] = useState([]);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [animatedAverage, setAnimatedAverage] = useState(0);
  const [animatedLatest, setAnimatedLatest] = useState(0);
  const [animatedDelta, setAnimatedDelta] = useState(0);
  const formatMonthLabel = (value) => {
    if (!value || typeof value !== 'string' || !value.includes('-')) return value || 'N/A';
    const [year, month] = value.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  };

  const monthlyData = useMemo(() => aggregateExpensesByMonth(data), [data]);

  const trendInsights = useMemo(() => {
    if (!monthlyData.length) {
      return {
        peak: null,
        average: 0,
        latestDelta: null
      };
    }

    const peak = monthlyData.reduce((max, item) => (item.total > max.total ? item : max), monthlyData[0]);
    const average = monthlyData.reduce((sum, item) => sum + item.total, 0) / monthlyData.length;
    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    const latestDelta = previous ? ((latest.total - previous.total) / (previous.total || 1)) * 100 : null;

    return { peak, average, latestDelta };
  }, [monthlyData]);

  const latestMonth = monthlyData[monthlyData.length - 1] || null;
  const totalSpend = monthlyData.reduce((sum, item) => sum + item.total, 0);
  const momTrendDirection = trendInsights.latestDelta == null ? 'flat' : trendInsights.latestDelta >= 0 ? 'up' : 'down';

  useEffect(() => {
    const duration = 500;
    const steps = 24;
    const avgTarget = trendInsights.average || 0;
    const latestTarget = latestMonth?.total || 0;
    const deltaTarget = trendInsights.latestDelta || 0;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedAverage(avgTarget * eased);
      setAnimatedLatest(latestTarget * eased);
      setAnimatedDelta(deltaTarget * eased);

      if (progress >= 1) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [trendInsights.average, trendInsights.latestDelta, latestMonth?.total]);

  // Handle bar click to show expense breakdown
  const handleBarClick = (barData) => {
    if (!barData || !barData.month) return;
    
    setSelectedMonth(barData.month);
    
    // Get expenses for the selected month
    const monthExpenses = data.filter(
      (expense) => getBillingPeriodMonthKey(expense) === barData.month
    );

    // Group by service for breakdown
    const breakdown = {};
    monthExpenses.forEach(expense => {
      const service = expense.service_name || 'Unknown Service';
      const amount = getExpenseAmount(expense);
      
      if (!breakdown[service]) {
        breakdown[service] = {
          service,
          total: 0,
          count: 0,
          expenses: []
        };
      }
      
      breakdown[service].total += amount;
      breakdown[service].count += 1;
      breakdown[service].expenses.push({
        id: expense.id,
        amount,
        date: expense.date_paid || expense.date || expense.created_at,
        invoice_number: expense.invoice_number || `INV-${expense.id}`,
        description: expense.description || 'No description'
      });
    });

    setMonthBreakdown(Object.values(breakdown).sort((a, b) => b.total - a.total));
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Header with Filter and Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          {!hideTitle && <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Expense Trend</h3>}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {monthlyData.length} months of data • Total: AED {totalSpend.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Totals use the billing period from Expense Tracker (e.g. Jan 2026, Feb 2026)
          </p>
          {skippedCount > 0 && (
            <button
              type="button"
              onClick={onReviewExcluded}
              className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium hover:underline text-left"
            >
              {skippedCount} expense{skippedCount === 1 ? '' : 's'} excluded — review and add billing period
            </button>
          )}
        </div>
        
        {/* Summary Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-center px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 shadow-sm">
            <p className="text-xs text-blue-600 dark:text-blue-300 uppercase font-semibold">Peak Month</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {trendInsights.peak?.month ? formatMonthLabel(trendInsights.peak.month) : 'N/A'}
            </p>
          </div>
          <div className="text-center px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 shadow-sm">
            <p className="text-xs text-emerald-600 dark:text-emerald-300 uppercase font-semibold">Average</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              AED {Math.round(animatedAverage).toLocaleString()}
            </p>
          </div>
          {latestMonth && (
            <div className="text-center px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 shadow-sm">
              <p className="text-xs text-cyan-600 dark:text-cyan-300 uppercase font-semibold">Latest</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                AED {Math.round(animatedLatest).toLocaleString()}
              </p>
            </div>
          )}
          {trendInsights.latestDelta !== null && (
            <div className={`text-center px-3 py-2 rounded-xl border shadow-sm ${
              trendInsights.latestDelta >= 0
                ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800'
                : 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800'
            }`}>
              <p className={`text-xs uppercase font-semibold ${
                trendInsights.latestDelta >= 0 ? 'text-violet-600 dark:text-violet-300' : 'text-rose-600 dark:text-rose-300'
              }`}>
                MoM Change
              </p>
              <div className="mt-0.5 flex items-center justify-center gap-1.5">
                <svg className="w-6 h-3" viewBox="0 0 24 10" fill="none" aria-hidden="true">
                  <path
                    d={momTrendDirection === 'down' ? "M1 2.5C5 2.5 7 8 11 8C15 8 17 2.5 23 2.5" : "M1 8C5 8 7 2.5 11 2.5C15 2.5 17 8 23 8"}
                    stroke={momTrendDirection === 'down' ? "#E11D48" : "#7C3AED"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trendInsights.latestDelta >= 0 ? '+' : ''}{animatedDelta.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedMonth && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Focused month: {formatMonthLabel(selectedMonth)}
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(null);
              setMonthBreakdown([]);
            }}
            className="ml-1 underline decoration-dotted hover:text-blue-900 dark:hover:text-blue-100"
          >
            Clear
          </button>
        </motion.div>
      )}

      <div className="h-96 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-gray-800 dark:via-blue-900/15 dark:to-indigo-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        {monthlyData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-gray-500">No data available for monthly trends</p>
              <p className="text-sm text-gray-400 mt-2">
                {data?.length === 0 ? 'No expense data found' : 'No data matches the selected time range'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            <div className="h-full w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="monthlyTrendBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ];
                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-lg)',
                }}
                formatter={(value) => [`AED ${value.toLocaleString()}`, 'Amount']}
                labelFormatter={(label) => {
                  const [year, month] = label.split('-');
                  const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ];
                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                }}
              />
              <Bar 
                dataKey="total" 
                fill="url(#monthlyTrendBarGradient)"
                radius={[8, 8, 0, 0]}
                stroke="#1D4ED8"
                strokeWidth={1}
                onClick={handleBarClick}
                onMouseEnter={(barData) => setHoveredMonth(barData?.month || null)}
                onMouseLeave={() => setHoveredMonth(null)}
                style={{ cursor: 'pointer' }}
                animationDuration={700}
                animationEasing="ease-out"
              >
                {monthlyData.map((entry) => {
                  const isPeak = entry.month === trendInsights.peak?.month;
                  const isHovered = hoveredMonth === entry.month;
                  const isSelected = selectedMonth === entry.month;
                  return (
                    <Cell
                      key={`monthly-bar-${entry.month}`}
                      fill={isPeak ? '#6366F1' : '#3B82F6'}
                      fillOpacity={hoveredMonth && !isHovered ? 0.45 : (isPeak ? 1 : 0.9)}
                      stroke={isSelected || isHovered ? '#0F172A' : 'none'}
                      strokeWidth={isSelected || isHovered ? 1.5 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
                    </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Month Breakdown Modal */}
      {selectedMonth && monthBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(2px)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-800 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Expense Breakdown - {selectedMonth}
              </h4>
              <p className="text-blue-700 dark:text-blue-300">
                Click on any bar above to see detailed expense breakdown
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedMonth(null);
                setMonthBreakdown([]);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Service Breakdown */}
          <div className="space-y-4">
            {monthBreakdown.map((service, index) => (
              <div key={service.service} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-blue-600 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.service}
                    </h5>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      AED {service.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {service.count} transaction{service.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Individual Expenses */}
                <div className="space-y-2">
                  {service.expenses.map((expense, expIndex) => (
                    <div key={expIndex} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice #</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{expense.invoice_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Amount</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            AED {expense.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Date</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Description</p>
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {expense.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Departmental Expenses Chart Component
const DepartmentalExpensesLineChart = ({ data }) => {
  const [filterType, setFilterType] = useState('monthly');
  const [hiddenDepartments, setHiddenDepartments] = useState(new Set());

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const { chartData, departmentSeries, departmentTotals } = useMemo(() => {
    const deptData = {};

    (data || []).forEach((expense) => {
      const dept = canonicalDepartmentName(
        expense.department || expense.dept || expense.division
      );
      const amount = parseAmountValue(
        expense.amount_aed || expense.amount || expense.value || expense.cost
      );
      if (!amount || amount <= 0) return;

      if (!deptData[dept]) {
        deptData[dept] = { monthly: {}, yearly: {}, total: 0 };
      }
      deptData[dept].total += amount;

      const date =
        parseDate(expense.date_paid) ||
        parseDate(expense.date) ||
        parseDate(expense.created_at) ||
        parseDate(expense.updated_at);

      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        deptData[dept].monthly[monthKey] = (deptData[dept].monthly[monthKey] || 0) + amount;

        const yearKey = date.getFullYear().toString();
        deptData[dept].yearly[yearKey] = (deptData[dept].yearly[yearKey] || 0) + amount;
      }
    });

    const sortedDepts = Object.entries(deptData)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([dept]) => dept);

    const topDepts = sortedDepts.slice(0, 7);
    const restDepts = sortedDepts.slice(7);
    const displayDepts = restDepts.length ? [...topDepts, 'Others'] : topDepts;

    if (restDepts.length) {
      deptData.Others = { monthly: {}, yearly: {}, total: 0 };
      restDepts.forEach((dept) => {
        deptData.Others.total += deptData[dept].total;
        Object.entries(deptData[dept].monthly).forEach(([month, val]) => {
          deptData.Others.monthly[month] = (deptData.Others.monthly[month] || 0) + val;
        });
        Object.entries(deptData[dept].yearly).forEach(([year, val]) => {
          deptData.Others.yearly[year] = (deptData.Others.yearly[year] || 0) + val;
        });
      });
    }

    const buildRows = (periodKeys, bucket) =>
      periodKeys.map((period) => {
        const row = { period };
        displayDepts.forEach((dept) => {
          row[dept] = deptData[dept]?.[bucket]?.[period] || 0;
        });
        return row;
      });

    let rows = [];
    if (filterType === 'monthly') {
      const allMonths = new Set();
      displayDepts.forEach((dept) => {
        Object.keys(deptData[dept]?.monthly || {}).forEach((m) => allMonths.add(m));
      });
      rows = buildRows(Array.from(allMonths).sort(), 'monthly');
    } else {
      const allYears = new Set();
      displayDepts.forEach((dept) => {
        Object.keys(deptData[dept]?.yearly || {}).forEach((y) => allYears.add(y));
      });
      rows = buildRows(Array.from(allYears).sort(), 'yearly');
    }

    const totals = {};
    displayDepts.forEach((dept) => {
      totals[dept] = deptData[dept]?.total || 0;
    });

    return {
      chartData: rows,
      departmentSeries: displayDepts,
      departmentTotals: totals,
    };
  }, [data, filterType]);

  const toggleDepartment = (dept) => {
    setHiddenDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const visibleDepartments = departmentSeries.filter((d) => !hiddenDepartments.has(d));
  const xTickInterval = filterType === 'monthly' && chartData.length > 14
    ? Math.ceil(chartData.length / 12) - 1
    : 0;

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-400">No departmental expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return <ChartEmptyState title="No departmental trends yet" subtitle="Expenses need a date and department to appear here" icon={BarChart3} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex bg-gray-100 dark:bg-gray-700/60 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setFilterType('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterType === 'monthly'
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setFilterType('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterType === 'yearly'
                ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Yearly
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click legend items to show/hide departments
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {departmentSeries.map((dept) => {
          const hidden = hiddenDepartments.has(dept);
          const color = DEPARTMENT_CHART_COLORS[dept] || COLORS[departmentSeries.indexOf(dept) % COLORS.length];
          const label = dept === 'Others' ? 'Others' : getDepartmentLabel(dept);

          return (
            <button
              key={dept}
              type="button"
              onClick={() => toggleDepartment(dept)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                hidden
                  ? 'opacity-40 border-gray-200 dark:border-gray-600 text-gray-500'
                  : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {label}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: filterType === 'monthly' ? 48 : 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.35} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            interval={xTickInterval}
            angle={filterType === 'monthly' ? -40 : 0}
            textAnchor={filterType === 'monthly' ? 'end' : 'middle'}
            height={filterType === 'monthly' ? 56 : 30}
            tickFormatter={(value) => {
              if (filterType === 'monthly') {
                const [year, month] = value.split('-');
                const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return `${names[parseInt(month, 10) - 1]} '${year.slice(2)}`;
              }
              return value;
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-raised, #fff)',
              border: '1px solid var(--border-primary, #e5e7eb)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name) => [
              `AED ${Number(value).toLocaleString()}`,
              name === 'Others' ? 'Others' : getDepartmentLabel(name),
            ]}
            labelFormatter={(label) => {
              if (filterType === 'monthly') {
                const [year, month] = label.split('-');
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
              }
              return `Year ${label}`;
            }}
          />
          {visibleDepartments.map((dept) => (
            <Line
              key={dept}
              type="monotone"
              dataKey={dept}
              name={dept === 'Others' ? 'Others' : getDepartmentLabel(dept)}
              stroke={DEPARTMENT_CHART_COLORS[dept] || '#94A3B8'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Average Spending Chart Component
const AverageSpendingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <ChartEmptyState title="No expense data available" subtitle="Add some expenses to see average spending by service" icon={Target} />;
  }

  // Calculate average spending by service - try different possible field names
  const serviceStats = {};
  data.forEach(expense => {
    // Try different possible field names for service and amount
    const rawServiceName = expense.service_name || expense.service || expense.category || expense.description || 'Unknown Service';
    const serviceName = normalizeServiceLabel(rawServiceName);
    const rawAmount = expense.amount_aed ?? expense.amount ?? expense.value ?? expense.cost ?? 0;
    const amount = parseAmountValue(rawAmount);
    
    if (!serviceName || amount <= 0) return;
    
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = {
        total: 0,
        count: 0
      };
    }
    serviceStats[serviceName].total += amount;
    serviceStats[serviceName].count += 1;
  });
  
  const chartData = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service: service.length > 20 ? service.substring(0, 20) + '...' : service,
      average: stats.total / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8); // Top 8 services

  // If no valid data, show empty state
  if (chartData.length === 0) {
    return <ChartEmptyState title="No spending data available" subtitle="Check if expense data has service names and amounts" icon={Target} />;
  }

  return (
    <div className="h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="averageGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#EC4899" stopOpacity={0.8} />
            </linearGradient>
            <filter id="barGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={{ stroke: '#D1D5DB' }}
            tickFormatter={(value) => {
              if (value === 0) return '0';
              if (value < 1000) return `${value.toFixed(0)}`;
              return `${(value / 1000).toFixed(1)}k`;
            }}
          />
          <YAxis 
            type="category" 
            dataKey="service" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={{ stroke: '#D1D5DB' }}
            width={120}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <p className="font-bold text-gray-800 dark:text-white text-lg">{label}</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {data.average.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Average per transaction ({data.count} transactions)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="average" 
            fill="url(#averageGradient)"
            radius={[0, 8, 8, 0]}
            stroke="#1D4ED8"
            strokeWidth={1}
            filter="url(#barGlow)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Top Expense Categories Component
const TopExpenseCategories = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  // Calculate total spending by service - try different possible field names
  const serviceStats = {};
  data.forEach(expense => {
    // Try different possible field names for service and amount
    const rawServiceName = expense.service_name || expense.service || expense.category || expense.description || 'Unknown Service';
    const serviceName = normalizeServiceLabel(rawServiceName);
    const rawAmount = expense.amount_aed ?? expense.amount ?? expense.value ?? expense.cost ?? 0;
    const amount = parseAmountValue(rawAmount);
    
    if (!serviceName || amount <= 0) return;
    
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = {
        total: 0,
        count: 0
      };
    }
    serviceStats[serviceName].total += amount;
    serviceStats[serviceName].count += 1;
  });

  const topCategories = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service,
      total: stats.total,
      count: stats.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5 categories

  // If no valid data, show empty state
  if (topCategories.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <span className="text-4xl mb-4">📊</span>
          <p className="text-lg font-medium text-gray-400">No spending data available</p>
          <p className="text-sm text-gray-400 mt-1">Check if expense data has service names and amounts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <div className="h-full overflow-y-auto space-y-4 pr-2">
        {topCategories.map((item, index) => (
          <div key={item.service} className="group bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-200">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Color and Service info */}
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0 ring-2 ring-white"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate mb-1 group-hover:text-blue-600 transition-colors">
                    {item.service}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="mr-2">📊</span>
                    {item.count} transactions
                  </div>
                </div>
              </div>
              
              {/* Right side - Amount and percentage */}
              <div className="text-right ml-4 min-w-[160px] flex-shrink-0">
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {item.total.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {((item.total / Math.max(...topCategories.map(d => d.total))) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Analytics() {
  const { user, userProfile } = useAuth();
  
  // For admin users, show all expenses. For other users, show only their expenses
  const isAdmin = userProfile?.role === 'admin';
  const expenseFilters = isAdmin ? {} : { userId: user?.id };
  
  const { data: expenses = [], isLoading, error } = useAllExpenses(expenseFilters);
  const { data: paymentEvents = [] } = usePaymentEvents();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [exportToast, setExportToast] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [excludedPanelOpen, setExcludedPanelOpen] = useState(true);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      ...(filterType === 'timeRange' ? { year: 'all' } : {}),
      ...(filterType === 'year' && value !== 'all' ? { timeRange: 'all-time' } : {}),
    }));
  };

  const resetAllFilters = () => {
    setFilters(DEFAULT_ANALYTICS_FILTERS);
  };

  const handleChartExport = async (containerId, fileName) => {
    const ok = await downloadChartPng(containerId, fileName);
    setExportToast(ok ? "Chart exported as PNG" : "Export failed. Please try again.");
  };

  useEffect(() => {
    if (!exportToast) return;
    const t = setTimeout(() => setExportToast(null), 2200);
    return () => clearTimeout(t);
  }, [exportToast]);

  const availableYears = useMemo(() => {
    const years = new Set();
    expenses.forEach((expense) => {
      const monthKey = getBillingPeriodMonthKey(expense);
      if (monthKey) {
        years.add(Number(monthKey.split('-')[0]));
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  const monthlyTrendExpenses = useMemo(
    () => filterExpensesForMonthlyTrend(expenses, filters),
    [expenses, filters]
  );

  const monthlyTrendSkippedCount = useMemo(
    () => countExpensesMissingBillingPeriod(expenses, filters),
    [expenses, filters]
  );

  const excludedFromMonthlyTrend = useMemo(
    () => getExpensesMissingBillingPeriod(expenses, filters),
    [expenses, filters]
  );

  const reviewExcludedExpenses = useCallback(() => {
    setExcludedPanelOpen(true);
    window.setTimeout(() => {
      document.getElementById('missing-billing-period-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);
  }, []);

  const { current: summaryStats, comparison, currentExpenses: effectiveExpenses } = useMemo(
    () => computeAnalyticsWithComparison(expenses, filters),
    [expenses, filters]
  );

  const cashFlowSummary = useMemo(
    () => computeCashFlowSummary(paymentEvents, expenses),
    [paymentEvents, expenses]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.timeRange !== 'all-time') count += 1;
    if (filters.year !== 'all') count += 1;
    if (filters.comparison !== 'none') count += 1;
    if (filters.department !== 'all') count += 1;
    if (filters.serviceStatus !== 'all') count += 1;
    return count;
  }, [filters]);

  const handleExportCsv = () => {
    if (!effectiveExpenses.length) {
      setExportToast('No data to export for current filters.');
      return;
    }
    exportExpensesCsv(effectiveExpenses);
    setExportToast('CSV exported successfully.');
  };





  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="xl" text="Loading analytics data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <p className="text-red-800 dark:text-red-200 font-semibold mb-1">Error loading analytics data</p>
            <p className="text-red-600 dark:text-red-300">{error.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    );
  }

  const comparisonLabel = comparison?.label;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsHero
          timeRange={filters.timeRange}
          onTimeRangeChange={(value) => handleFilterChange('timeRange', value)}
          onResetFilters={resetAllFilters}
          onExport={handleExportCsv}
          exportDisabled={!effectiveExpenses.length}
        />

        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Advanced filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
            {isFilterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <AnalyticsFiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          isExpanded={isFilterExpanded}
          availableYears={availableYears}
        />

        {exportToast && (
          <div className="fixed right-6 bottom-6 z-50 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm shadow-xl">
            {exportToast}
          </div>
        )}

        {expenses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-emerald-800 dark:text-emerald-200"
          >
            No expense records found yet. Add or import expenses in Expense Tracker to unlock analytics.
          </motion.div>
        )}

        {expenses.length > 0 && effectiveExpenses.length === 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Current filters returned no rows. Use Reset to restore full analytics.
          </div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 p-2 mb-6"
        >
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'breakdown', label: 'Service Breakdown' },
              { id: 'distribution', label: 'Distribution' },
              { id: 'monthly-breakdown', label: 'Monthly Breakdown' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnalyticsKpiCard
                    title="Total Services"
                    value={summaryStats.totalServices.toLocaleString()}
                    icon={DollarSign}
                    color="blue"
                    delay={0.05}
                    delta={comparison?.totalServices}
                    comparisonLabel={comparisonLabel}
                  />
                  <AnalyticsKpiCard
                    title="Total Spent"
                    value={formatCurrency(summaryStats.totalSpent)}
                    icon={TrendingUp}
                    color="green"
                    delay={0.1}
                    delta={comparison?.totalSpent}
                    comparisonLabel={comparisonLabel}
                  />
                  <AnalyticsKpiCard
                    title="Avg per Service"
                    value={formatCurrency(Math.round(summaryStats.averagePerService))}
                    icon={Calendar}
                    color="amber"
                    delay={0.15}
                    delta={comparison?.averagePerService}
                    comparisonLabel={comparisonLabel}
                  />
                  <AnalyticsKpiCard
                    title="Transactions"
                    value={summaryStats.totalTransactions.toLocaleString()}
                    icon={Shield}
                    color="purple"
                    delay={0.2}
                    delta={comparison?.totalTransactions}
                    comparisonLabel={comparisonLabel}
                  />
                </div>

                <CashFlowSummary
                  summary={cashFlowSummary}
                  hasPaymentEvents={paymentEvents.length > 0}
                />

                <section>
                  <OverviewSectionHeader
                    title="Spending over time"
                    subtitle="Track how total spend changes month by month"
                  />
                  <OverviewChartCard
                    title="Monthly Expense Trend"
                    icon={TrendingUp}
                    iconTone="purple"
                    exportContainerId="chart-overview-monthly-trend"
                    exportFileName="overview-monthly-expense-trend"
                    onExport={handleChartExport}
                    delay={0.25}
                  >
                    <MonthlyExpenseTrendChart
                      data={monthlyTrendExpenses}
                      skippedCount={monthlyTrendSkippedCount}
                      onReviewExcluded={reviewExcludedExpenses}
                      hideTitle
                    />
                    <MissingBillingPeriodPanel
                      expenses={excludedFromMonthlyTrend}
                      expanded={excludedPanelOpen}
                      onExpandedChange={setExcludedPanelOpen}
                    />
                  </OverviewChartCard>
                </section>

                <section>
                  <OverviewSectionHeader
                    title="Where your budget goes"
                    subtitle="Share of spend across services and categories"
                  />
                  <OverviewChartCard
                    title="Service Distribution"
                    subtitle="Proportional breakdown of spending by service"
                    icon={PieChartIcon}
                    iconTone="green"
                    exportContainerId="chart-overview-service-distribution"
                    exportFileName="overview-service-distribution"
                    onExport={handleChartExport}
                    delay={0.3}
                  >
                    <ServiceDistributionChart expenses={effectiveExpenses} />
                  </OverviewChartCard>
                </section>

                <section>
                  <OverviewSectionHeader
                    title="Department view"
                    subtitle="Compare spending trends across departments"
                  />
                  <OverviewChartCard
                    title="Departmental Expenses"
                    icon={BarChart3}
                    iconTone="orange"
                    exportContainerId="chart-overview-departmental"
                    exportFileName="overview-departmental-expenses"
                    onExport={handleChartExport}
                    delay={0.35}
                  >
                    <DepartmentalExpensesLineChart data={effectiveExpenses} />
                  </OverviewChartCard>
                </section>

                <section>
                  <OverviewSectionHeader
                    title="Service insights"
                    subtitle="Average spend and top categories at a glance"
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <OverviewChartCard
                      title="Average Spending by Service"
                      icon={Target}
                      iconTone="indigo"
                      exportContainerId="chart-overview-average-spending"
                      exportFileName="overview-average-spending"
                      onExport={handleChartExport}
                      delay={0.4}
                    >
                      <AverageSpendingChart data={effectiveExpenses} />
                    </OverviewChartCard>
                    <OverviewChartCard
                      title="Top Expense Categories"
                      icon={Star}
                      iconTone="pink"
                      exportContainerId="chart-overview-top-categories"
                      exportFileName="overview-top-expense-categories"
                      onExport={handleChartExport}
                      delay={0.45}
                    >
                      <TopExpenseCategories data={effectiveExpenses} />
                    </OverviewChartCard>
                  </div>
                </section>

                <section>
                  <OverviewSectionHeader
                    title="Explore deeper"
                    subtitle="Jump to detailed views for drill-down analysis"
                  />
                  <OverviewQuickLinks onNavigate={setActiveTab} />
                </section>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Service Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChartExport('chart-service-breakdown', 'service-breakdown')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG
                      </button>
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <div id="chart-service-breakdown">
                    <ServiceBreakdownChart expenses={effectiveExpenses} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Departmental Expenses</h3>
                    <button
                      type="button"
                      onClick={() => handleChartExport('chart-overview-departmental', 'departmental-expenses')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PNG
                    </button>
                  </div>
                  <div id="chart-overview-departmental">
                    <DepartmentalExpensesLineChart data={effectiveExpenses} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'distribution' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Service Distribution</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChartExport('chart-service-distribution', 'service-distribution')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG
                      </button>
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <PieChartIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>
                  <div id="chart-service-distribution">
                    <ServiceDistributionChart expenses={effectiveExpenses} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Average Spending by Service</h3>
                      <button
                        type="button"
                        onClick={() => handleChartExport('chart-overview-average-spending', 'average-spending')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG
                      </button>
                    </div>
                    <div id="chart-overview-average-spending">
                      <AverageSpendingChart data={effectiveExpenses} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Expense Categories</h3>
                      <button
                        type="button"
                        onClick={() => handleChartExport('chart-overview-top-categories', 'top-expense-categories')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG
                      </button>
                    </div>
                    <div id="chart-overview-top-categories">
                      <TopExpenseCategories data={effectiveExpenses} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700">
                  <IndividualServiceTrends expenses={effectiveExpenses} />
                </div>
              </motion.div>
            )}

            {activeTab === 'monthly-breakdown' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Service Expense Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChartExport('chart-monthly-breakdown', 'monthly-breakdown')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG
                      </button>
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Click on any service bar to see detailed monthly breakdown with payment information</p>
                  <div id="chart-monthly-breakdown">
                    <MonthlyBreakdownCharts expenses={effectiveExpenses} />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
