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

const MONTH_NAME_TO_NUM = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/** Parse YYYY-MM-DD (and timestamps) without UTC month-shift bugs. */
export function parseExpenseDateLocal(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string') {
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const y = Number(iso[1]);
      const m = Number(iso[2]);
      const d = Number(iso[3]);
      const date = new Date(y, m - 1, d);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKeyFromParts(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;
  return `${y}-${String(m).padStart(2, '0')}`;
}

function normalizeYear(year) {
  const y = Number(year);
  if (!Number.isInteger(y)) return null;
  if (y < 100) return 2000 + y;
  return y;
}

function monthKeyFromName(monthName, year) {
  const monthNum = MONTH_NAME_TO_NUM[String(monthName).toLowerCase()];
  const y = normalizeYear(year);
  if (!monthNum || y == null) return null;
  return monthKeyFromParts(y, monthNum);
}

/** Parse billing period text (e.g. "Jun 2026", "January 2026") to YYYY-MM month key. */
export function parseMonthsToMonthKey(months) {
  if (months == null || months === '') return null;
  const value = String(months).trim().replace(/\s+/g, ' ');
  if (!value) return null;

  let match = value.match(/^(\d{4})-(\d{1,2})$/);
  if (match) return monthKeyFromParts(match[1], match[2]);

  match = value.match(/^(\d{4})[/.-](\d{1,2})$/);
  if (match) return monthKeyFromParts(match[1], match[2]);

  match = value.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (match) return monthKeyFromParts(match[2], match[1]);

  match = value.match(/^([a-zA-Z]+)[,\s]+(\d{2,4})$/);
  if (match) return monthKeyFromName(match[1], match[2]);

  match = value.match(/^([a-zA-Z]+)[\-/](\d{2,4})$/);
  if (match) return monthKeyFromName(match[1], match[2]);

  const parsed = parseExpenseDateLocal(value);
  if (parsed) {
    return monthKeyFromParts(parsed.getFullYear(), parsed.getMonth() + 1);
  }

  return null;
}

/** Billing period month key from the Expense Tracker `months` field only. */
export function getBillingPeriodMonthKey(expense) {
  return parseMonthsToMonthKey(expense?.months);
}

/** Month bucket for charts: billing period first, then payment/invoice dates. */
export function getExpenseMonthKey(expense) {
  const fromMonths = getBillingPeriodMonthKey(expense);
  if (fromMonths) return fromMonths;

  const date = getExpenseDate(expense);
  if (!date) return null;

  return monthKeyFromParts(date.getFullYear(), date.getMonth() + 1);
}

export function getExpenseDate(expense) {
  return parseExpenseDateLocal(
    expense?.date_paid ||
      expense?.invoice_due_date ||
      expense?.invoice_generation_date ||
      expense?.date ||
      expense?.created_at
  );
}

function applyDepartmentAndStatusFilters(expenses, filters) {
  let filtered = [...expenses];

  if (filters.department && filters.department !== 'all') {
    filtered = filtered.filter((e) => (e.department || '') === filters.department);
  }

  if (filters.serviceStatus && filters.serviceStatus !== 'all') {
    filtered = filtered.filter(
      (e) => (e.service_status || e.status || '').toLowerCase() === filters.serviceStatus
    );
  }

  return filtered;
}

function billingPeriodInRange(monthKey, start, end) {
  if (!monthKey) return false;
  const [y, m] = monthKey.split('-').map(Number);
  const periodStart = new Date(y, m - 1, 1);
  const periodEnd = new Date(y, m, 0, 23, 59, 59, 999);
  if (start && periodEnd < start) return false;
  if (end && periodStart > end) return false;
  return true;
}

/** Expenses for the Monthly Expense Trend chart — grouped by billing period (`months`). */
export function filterExpensesForMonthlyTrend(expenses, filters) {
  if (!expenses?.length) return [];

  let filtered = applyDepartmentAndStatusFilters(expenses, filters);
  filtered = filtered.filter((e) => getBillingPeriodMonthKey(e));

  if (filters.year && filters.year !== 'all') {
    const selectedYear = Number(filters.year);
    filtered = filtered.filter((e) => {
      const key = getBillingPeriodMonthKey(e);
      return Number(key.split('-')[0]) === selectedYear;
    });
  } else if (filters.timeRange !== 'all-time') {
    const { start, end } = getTimeRangeBounds(filters.timeRange);
    filtered = filtered.filter((e) =>
      billingPeriodInRange(getBillingPeriodMonthKey(e), start, end)
    );
  }

  return filtered;
}

export function suggestBillingPeriod(expense) {
  const date = getExpenseDate(expense);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getExpensesMissingBillingPeriod(expenses, filters) {
  if (!expenses?.length) return [];

  const scoped = applyDepartmentAndStatusFilters(expenses, filters);

  return scoped.filter((e) => {
    const amount = getExpenseAmount(e);
    if (!amount || amount <= 0) return false;
    return !getBillingPeriodMonthKey(e);
  });
}

export function countExpensesMissingBillingPeriod(expenses, filters) {
  return getExpensesMissingBillingPeriod(expenses, filters).length;
}

export function aggregateExpensesByMonth(expenses) {
  if (!expenses?.length) return [];

  const monthlyStats = {};

  expenses.forEach((expense) => {
    const amount = getExpenseAmount(expense);
    if (!amount || amount <= 0) return;

    const monthKey = getBillingPeriodMonthKey(expense);
    if (!monthKey) return;

    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + amount;
  });

  return Object.entries(monthlyStats)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

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
  const billingKey = getBillingPeriodMonthKey(expense);
  if (billingKey) {
    return billingPeriodInRange(billingKey, start, end);
  }

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
      const billingKey = getBillingPeriodMonthKey(e);
      if (billingKey) {
        return Number(billingKey.split('-')[0]) === selectedYear;
      }
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
