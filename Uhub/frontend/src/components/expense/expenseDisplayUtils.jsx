import { getDepartmentLabel, getDepartmentColor } from '../../config/departments';

export const COLUMN_DEFS = [
  { key: 'service_name', label: 'Service', align: 'left', locked: true },
  { key: 'invoice_number', label: 'Invoice #', align: 'left', defaultVisible: true },
  { key: 'invoice_generation_date', label: 'Gen. Date', align: 'left', defaultVisible: false },
  { key: 'invoice_due_date', label: 'Due Date', align: 'left', defaultVisible: true },
  { key: 'amount_aed', label: 'Amount', align: 'right', locked: true },
  { key: 'date_paid', label: 'Date Paid', align: 'left', defaultVisible: true },
  { key: 'department', label: 'Department', align: 'left', defaultVisible: true },
  { key: 'service_status', label: 'Status', align: 'left', defaultVisible: true },
];

export const EXPENSE_VIEW_MODE_KEY = 'uhub-expense-view-mode';
export const EXPENSE_COLUMNS_KEY = 'uhub-expense-table-columns';

export const DEPT_BADGE_STYLES = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
  pink: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-800',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-800',
  purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-800',
  orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
  violet: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-800',
  teal: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-800',
  amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800',
  gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
};

export const editInputClass =
  'w-full min-w-0 box-border px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm';

export const editSelectClass =
  'w-full min-w-0 box-border px-2.5 py-1.5 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm';

export function getDefaultColumnVisibility() {
  return COLUMN_DEFS.reduce((acc, col) => {
    acc[col.key] = col.locked ? true : col.defaultVisible !== false;
    return acc;
  }, {});
}

export function loadColumnVisibility() {
  try {
    const saved = localStorage.getItem(EXPENSE_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultColumnVisibility(), ...parsed };
    }
  } catch {
    /* ignore */
  }
  return getDefaultColumnVisibility();
}

export function saveColumnVisibility(columns) {
  try {
    localStorage.setItem(EXPENSE_COLUMNS_KEY, JSON.stringify(columns));
  } catch {
    /* ignore */
  }
}

export function loadViewMode() {
  try {
    const saved = localStorage.getItem(EXPENSE_VIEW_MODE_KEY);
    if (saved === 'table' || saved === 'cards') return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
    return 'cards';
  }
  return 'table';
}

export function saveViewMode(mode) {
  try {
    localStorage.setItem(EXPENSE_VIEW_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatServiceName(name) {
  if (!name) return 'Untitled';
  if (name === name.toUpperCase() && /[A-Z]/.test(name)) {
    return name
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return name;
}

export function serviceInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'final' || status === 'inactive') return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:ring-emerald-800',
    pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:ring-amber-800',
    final: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-blue-800',
    inactive: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600',
  };

  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || styles.inactive}`}>
      {status}
    </span>
  );
}

export function DepartmentBadge({ department }) {
  const label = getDepartmentLabel(department) || department || 'N/A';
  const color = getDepartmentColor(department);
  const style = DEPT_BADGE_STYLES[color] || DEPT_BADGE_STYLES.gray;

  return (
    <span className={`inline-flex max-w-[160px] truncate px-2.5 py-1 text-xs font-medium rounded-lg border ${style}`} title={label}>
      {label}
    </span>
  );
}
