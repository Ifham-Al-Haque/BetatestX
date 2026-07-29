import { getExpenseMonthKey } from './analyticsHelpers';
import { getExpenseAmount, getBreakdownTotal, getBreakdownRemaining } from './expenseHelpers';
import { canonicalServiceName } from '../components/analytics/chartUtils';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Convert YYYY-MM to display label e.g. "Jan 26" */
export function monthKeyToShortLabel(monthKey) {
  if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) {
    return monthKey || '';
  }
  const [year, month] = monthKey.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return monthKey;
  return `${MONTH_NAMES[monthIndex]} ${String(year).slice(-2)}`;
}

/** Parse "Jan 26" style label back to Date for sorting */
export function shortLabelToDate(monthLabel) {
  if (!monthLabel || typeof monthLabel !== 'string') return new Date(0);
  const [month, year] = monthLabel.split(' ');
  const monthIndex = MONTH_NAMES.indexOf(month);
  if (monthIndex < 0) return new Date(0);
  const fullYear = 2000 + parseInt(year, 10);
  return new Date(fullYear, monthIndex, 1);
}

function buildPaymentDetail(expense) {
  const breakdowns = (expense.breakdowns || []).filter(
    (item) => item?.label?.trim() && parseFloat(item.amount) > 0
  );
  const amount = getExpenseAmount(expense);

  return {
    expenseId: expense.id,
    payment_date: expense.date_paid,
    due_date: expense.invoice_due_date || expense.date_paid,
    invoice_date: expense.invoice_generation_date || expense.date_paid,
    amount,
    currency: expense.currency || 'AED',
    invoice_number: expense.invoice_number || `INV-${expense.id}`,
    billing_period: expense.months?.trim() || monthKeyToShortLabel(getExpenseMonthKey(expense)),
    breakdowns,
    hasBreakdown: breakdowns.length > 0,
    breakdownTotal: getBreakdownTotal(breakdowns),
  };
}

export function buildMonthlyServiceBreakdown(expenses = []) {
  const serviceMap = {};
  const paymentDetailsMap = {};

  expenses.forEach((expense) => {
    if (!expense.service_name || expense.amount_aed == null || expense.amount_aed === '') return;

    const monthKey = getExpenseMonthKey(expense);
    if (!monthKey) return;

    const service = canonicalServiceName(expense.service_name);
    const monthLabel = monthKeyToShortLabel(monthKey);
    const amount = getExpenseAmount(expense);

    if (!serviceMap[service]) {
      serviceMap[service] = {
        id: service,
        service_name: service,
        category: expense.department || 'Uncategorized',
        service_status: expense.service_status || 'Active',
        monthly_spending: {},
        transactions: 0,
      };
    }

    serviceMap[service].monthly_spending[monthLabel] =
      (serviceMap[service].monthly_spending[monthLabel] || 0) + amount;
    serviceMap[service].transactions += 1;

    const detailKey = `${service}__${monthLabel}`;
    if (!paymentDetailsMap[detailKey]) paymentDetailsMap[detailKey] = [];
    paymentDetailsMap[detailKey].push(buildPaymentDetail(expense));
  });

  const services = Object.values(serviceMap).map((service) => {
    const sortedMonths = Object.entries(service.monthly_spending).sort(
      ([monthA], [monthB]) => shortLabelToDate(monthA) - shortLabelToDate(monthB)
    );

    const sortedSpending = {};
    sortedMonths.forEach(([month, value]) => {
      sortedSpending[month] = value;
    });

    return {
      ...service,
      monthly_spending: sortedSpending,
      totalSpent: Object.values(sortedSpending).reduce((sum, value) => sum + (value || 0), 0),
      activeMonths: Object.keys(sortedSpending).length,
    };
  });

  services.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));

  return { services, paymentDetailsMap };
}

export function countBreakdownItems(paymentDetails = []) {
  return paymentDetails.reduce((sum, payment) => {
    if (!payment.hasBreakdown) return sum + 1;

    let count = payment.breakdowns.length;
    if (getBreakdownRemaining(payment.amount, payment.breakdowns) > 0.009) {
      count += 1;
    }
    return sum + count;
  }, 0);
}
