export const PERIOD_OPTIONS = [
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All Time' },
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'final', label: 'Final' },
];

export const getExpenseAmount = (expense) =>
  parseFloat(expense.amount_aed || expense.amount || 0);

export const getBreakdownTotal = (breakdowns = []) =>
  breakdowns.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

export const getBreakdownRemaining = (expenseAmount, breakdowns = []) =>
  Math.round(((parseFloat(expenseAmount) || 0) - getBreakdownTotal(breakdowns)) * 100) / 100;

export const validateExpenseBreakdowns = (expenseAmount, breakdowns = []) => {
  const populated = breakdowns.filter(
    (item) => String(item.label || '').trim() || String(item.amount ?? '').trim()
  );

  for (const item of populated) {
    if (!String(item.label || '').trim()) {
      return 'Each breakdown item needs a name.';
    }
    if (!Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0) {
      return `Enter a valid amount for "${item.label}".`;
    }
  }

  if (getBreakdownRemaining(expenseAmount, populated) < 0) {
    return 'Breakdown items cannot exceed the total expense amount.';
  }

  return null;
};

export const formatCurrency = (amount, currency = 'AED') => {
  const value = Number(amount) || 0;
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const applyPeriodFilter = (expenses, period) => {
  if (!period || period === 'all' || !expenses?.length) return expenses || [];

  const now = new Date();
  return expenses.filter((expense) => {
    const date = new Date(expense.date_paid);
    if (Number.isNaN(date.getTime())) return false;

    switch (period) {
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'quarter': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return date >= threeMonthsAgo;
      }
      case 'ytd':
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};

export const filterExpenses = (expenses, filters) => {
  if (!expenses?.length) return [];

  return expenses.filter((expense) => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        expense.service_name?.toLowerCase().includes(searchTerm) ||
        expense.department?.toLowerCase().includes(searchTerm) ||
        expense.invoice_number?.toLowerCase().includes(searchTerm) ||
        expense.months?.toLowerCase().includes(searchTerm) ||
        expense.notes?.toLowerCase().includes(searchTerm) ||
        expense.breakdowns?.some(
          (item) =>
            item.label?.toLowerCase().includes(searchTerm) ||
            item.notes?.toLowerCase().includes(searchTerm)
        );
      if (!matchesSearch) return false;
    }

    if (filters.department && expense.department !== filters.department) return false;
    if (filters.service_status && expense.service_status !== filters.service_status) return false;

    if (filters.startDate && new Date(expense.date_paid) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(expense.date_paid) > new Date(filters.endDate)) return false;

    const amount = getExpenseAmount(expense);
    if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;

    return true;
  });
};

export const sortExpenses = (expenses, sortField, sortDirection) => {
  const sorted = [...expenses];
  sorted.sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'amount_aed') {
      aValue = getExpenseAmount(a);
      bValue = getExpenseAmount(b);
    } else if (sortField === 'date_paid' || sortField === 'invoice_due_date' || sortField === 'invoice_generation_date') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue || '').toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

export const computeExpenseStats = (expenses) => {
  const totalAmount = expenses.reduce((sum, exp) => sum + getExpenseAmount(exp), 0);
  return {
    totalAmount,
    totalCount: expenses.length,
    activeCount: expenses.filter((exp) => exp.service_status === 'active').length,
    pendingCount: expenses.filter((exp) => exp.service_status === 'pending').length,
    finalCount: expenses.filter((exp) => exp.service_status === 'final').length,
  };
};

export const exportExpensesCsv = (expenses) => {
  if (!expenses.length) return;

  const headers = [
    'Service',
    'Invoice #',
    'Amount',
    'Currency',
    'Date Paid',
    'Gen. Date',
    'Due Date',
    'Department',
    'Status',
    'Months',
    'Notes',
    'Breakdown',
    'Breakdown Total',
    'Unallocated',
  ];

  const rows = expenses.map((e) => [
    e.service_name || '',
    e.invoice_number || '',
    getExpenseAmount(e),
    e.currency || 'AED',
    e.date_paid || '',
    e.invoice_generation_date || '',
    e.invoice_due_date || '',
    e.department || '',
    e.service_status || '',
    e.months || '',
    e.notes || '',
    (e.breakdowns || [])
      .map((item) => `${item.label}: ${item.amount}`)
      .join('; '),
    getBreakdownTotal(e.breakdowns || []),
    (e.breakdowns || []).length
      ? Math.max(0, getBreakdownRemaining(getExpenseAmount(e), e.breakdowns))
      : '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const EMPTY_EXPENSE_FORM = {
  service_name: '',
  amount_aed: '',
  currency: 'AED',
  months: '',
  service_status: 'active',
  department: '',
  date_paid: '',
  invoice_number: '',
  invoice_generation_date: '',
  invoice_due_date: '',
  notes: '',
  breakdowns: [],
};

export const getDefaultExpenseForm = () => ({
  ...EMPTY_EXPENSE_FORM,
  date_paid: new Date().toISOString().slice(0, 10),
  months: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
});

export const EMPTY_FILTERS = {
  search: '',
  department: '',
  service_status: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
};
