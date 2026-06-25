import { getExpenseAmount } from './expenseHelpers';
import { expandRecurringPaymentEvents } from './paymentRecurrence';

export const ANALYTICS_TIME_RANGES = [
  { value: 'current-month', label: 'Current Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'last-year', label: 'Last Year' },
  { value: 'all-time', label: 'All Time' },
];

export const ANALYTICS_COMPARISON_OPTIONS = [
  { value: 'none', label: 'No Comparison' },
  { value: 'previous-period', label: 'Previous Period' },
  { value: 'year-over-year', label: 'Year over Year' },
];

export const DEFAULT_ANALYTICS_FILTERS = {
  timeRange: 'all-time',
  comparison: 'none',
  year: 'all',
  department: 'all',
  serviceStatus: 'all',
};

const getExpenseDate = (expense) => {
  const raw = expense.date_paid || expense.date || expense.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isValueReady = (expense) =>
  expense.service_name && expense.amount_aed != null && expense.amount_aed !== '';

export function getTimeRangeBounds(timeRange, referenceDate = new Date()) {
  const now = new Date(referenceDate);
  const start = new Date(now);

  switch (timeRange) {
    case 'current-month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'last-3-months':
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'last-6-months':
      start.setMonth(now.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'last-year':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'all-time':
    default:
      return { start: null, end: now };
  }
}

function getComparisonBounds(filters, referenceDate = new Date()) {
  const now = new Date(referenceDate);

  if (filters.year && filters.year !== 'all') {
    const year = Number(filters.year);
    const currentStart = new Date(year, 0, 1);
    const currentEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    if (filters.comparison === 'year-over-year') {
      return {
        current: { start: currentStart, end: currentEnd },
        previous: {
          start: new Date(year - 1, 0, 1),
          end: new Date(year - 1, 11, 31, 23, 59, 59, 999),
        },
      };
    }

    if (filters.comparison === 'previous-period') {
      const spanMs = currentEnd.getTime() - currentStart.getTime();
      const prevEnd = new Date(currentStart.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - spanMs);
      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: prevStart, end: prevEnd },
      };
    }

    return { current: { start: currentStart, end: currentEnd }, previous: null };
  }

  const { start, end } = getTimeRangeBounds(filters.timeRange, now);
  if (!start || filters.comparison === 'none') {
    return { current: { start, end }, previous: null };
  }

  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - spanMs);

  if (filters.comparison === 'year-over-year') {
    return {
      current: { start, end },
      previous: {
        start: new Date(start.getFullYear() - 1, start.getMonth(), start.getDate()),
        end: new Date(end.getFullYear() - 1, end.getMonth(), end.getDate(), 23, 59, 59, 999),
      },
    };
  }

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd },
  };
}

function expenseInRange(expense, start, end) {
  const date = getExpenseDate(expense);
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function filterAnalyticsExpenses(expenses, filters) {
  if (!expenses?.length) return [];

  let filtered = [...expenses];

  if (filters.department && filters.department !== 'all') {
    filtered = filtered.filter((e) => (e.department || '') === filters.department);
  }

  if (filters.serviceStatus && filters.serviceStatus !== 'all') {
    filtered = filtered.filter(
      (e) => (e.service_status || e.status || '').toLowerCase() === filters.serviceStatus
    );
  }

  if (filters.year && filters.year !== 'all') {
    const selectedYear = Number(filters.year);
    filtered = filtered.filter((e) => {
      const date = getExpenseDate(e);
      return date && date.getFullYear() === selectedYear;
    });
  } else if (filters.timeRange !== 'all-time') {
    const { start, end } = getTimeRangeBounds(filters.timeRange);
    filtered = filtered.filter((e) => expenseInRange(e, start, end));
  }

  return filtered;
}

export function computeAnalyticsSummary(expenses) {
  if (!expenses.length) {
    return {
      totalServices: 0,
      totalSpent: 0,
      averagePerService: 0,
      totalTransactions: 0,
    };
  }

  const serviceStats = {};
  let totalSpent = 0;

  expenses.forEach((expense) => {
    if (!isValueReady(expense)) return;
    const service = expense.service_name.trim();
    const amount = getExpenseAmount(expense);
    serviceStats[service] = (serviceStats[service] || 0) + amount;
    totalSpent += amount;
  });

  const totalServices = Object.keys(serviceStats).length;

  return {
    totalServices,
    totalSpent,
    averagePerService: totalServices > 0 ? totalSpent / totalServices : 0,
    totalTransactions: expenses.filter(isValueReady).length,
  };
}

function computeDelta(current, previous) {
  if (previous == null || previous === 0) {
    if (current === 0) return { pct: null, direction: 'neutral' };
    return { pct: null, direction: 'up' };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    pct,
    direction: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'neutral',
  };
}

export function computeAnalyticsWithComparison(allExpenses, filters) {
  const scoped = filterAnalyticsExpenses(allExpenses, {
    ...filters,
    timeRange: filters.year !== 'all' ? 'all-time' : filters.timeRange,
  });

  const { current: currentBounds, previous: previousBounds } = getComparisonBounds(filters);

  let currentExpenses = scoped;
  if (currentBounds?.start || currentBounds?.end) {
    currentExpenses = scoped.filter((e) =>
      expenseInRange(e, currentBounds.start, currentBounds.end)
    );
  }

  const current = computeAnalyticsSummary(currentExpenses);

  let comparison = null;
  if (filters.comparison !== 'none' && previousBounds) {
    const previousExpenses = scoped.filter((e) =>
      expenseInRange(e, previousBounds.start, previousBounds.end)
    );
    const previous = computeAnalyticsSummary(previousExpenses);
    comparison = {
      totalSpent: computeDelta(current.totalSpent, previous.totalSpent),
      totalServices: computeDelta(current.totalServices, previous.totalServices),
      averagePerService: computeDelta(current.averagePerService, previous.averagePerService),
      totalTransactions: computeDelta(current.totalTransactions, previous.totalTransactions),
      label:
        filters.comparison === 'year-over-year'
          ? 'vs same period last year'
          : 'vs previous period',
    };
  }

  return { current, comparison, currentExpenses };
}

export function computeCashFlowSummary(paymentEvents = [], paidExpenses = []) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const expanded = expandRecurringPaymentEvents(paymentEvents, monthStart, monthEnd, {
    includePastOccurrences: false,
  });

  const paidThisMonth = paidExpenses
    .filter((e) => expenseInRange(e, monthStart, monthEnd))
    .reduce((sum, e) => sum + getExpenseAmount(e), 0);

  let scheduledThisMonth = 0;
  let dueSoon = 0;
  let overdue = 0;
  let recurringCount = 0;

  expanded.forEach((event) => {
    const amount = parseFloat(event.amount) || 0;
    const due = event.due_date ? new Date(event.due_date) : null;
    if (!due || Number.isNaN(due.getTime())) return;

    const status = (event.status || 'pending').toLowerCase();
    if (status === 'paid' || status === 'cancelled') return;

    if (due >= monthStart && due <= monthEnd) {
      scheduledThisMonth += amount;
    }
    if (due >= now && due <= weekEnd) {
      dueSoon += amount;
    }
    if (due < now && status !== 'paid') {
      overdue += amount;
    }
  });

  paymentEvents.forEach((event) => {
    if (event.is_recurring) recurringCount += 1;
  });

  return {
    paidThisMonth,
    scheduledThisMonth,
    dueSoon,
    overdue,
    recurringCount,
    netPosition: paidThisMonth - scheduledThisMonth,
  };
}

export function formatDeltaPct(pct) {
  if (pct == null || Number.isNaN(pct)) return null;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
