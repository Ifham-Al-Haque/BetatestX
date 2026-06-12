export const PAYROLL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PAYROLL_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export const formatPayrollCurrency = (value) =>
  `AED ${(Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const PAYROLL_TABS = [
  { id: 'records', label: 'Records', feature: 'payroll' },
  { id: 'run', label: 'Run Payroll', feature: 'payroll_calculator' },
  { id: 'history', label: 'Batch History', feature: 'payroll_calculator' },
];
