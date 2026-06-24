import { getDepartmentColor } from '../config/departments';

const DEPARTMENT_BADGE_CLASSES = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200',
};

export const getDepartmentBadgeClasses = (department) => {
  const color = getDepartmentColor(department);
  return DEPARTMENT_BADGE_CLASSES[color] || DEPARTMENT_BADGE_CLASSES.gray;
};

export const IT_STOCK_LABEL = 'IT STOCK';

export const buildEmployeeCurrentUser = (employee) => {
  if (!employee) return '';
  return employee.employee_id
    ? `${employee.full_name || 'Unknown'} (${employee.employee_id})`
    : employee.full_name || '';
};

export const applyEmployeeAssignment = (prev, employee) => {
  if (!employee) {
    return {
      ...prev,
      assigned_employee_id: '',
      assigned_employee_name: '',
      assigned_employee_email: '',
    };
  }

  const canonicalCurrentUser = buildEmployeeCurrentUser(employee);
  const shouldRollPrevious =
    prev.current_user &&
    prev.current_user !== canonicalCurrentUser &&
    prev.current_user !== IT_STOCK_LABEL;

  return {
    ...prev,
    previous_user: shouldRollPrevious ? prev.current_user : prev.previous_user,
    current_user: canonicalCurrentUser,
    department: prev.department || employee.department || '',
    designation: prev.designation || employee.position || '',
    assigned_employee_id: employee.employee_id || employee.id || '',
    assigned_employee_name: employee.full_name || '',
    assigned_employee_email: employee.email || '',
  };
};

export const applyItStockAssignment = (prev) => ({
  ...prev,
  previous_user:
    prev.current_user && prev.current_user !== IT_STOCK_LABEL ? prev.current_user : prev.previous_user,
  current_user: IT_STOCK_LABEL,
  assigned_employee_id: '',
  assigned_employee_name: '',
  assigned_employee_email: '',
});

export const validateSimCardForm = (formData) => {
  const errors = [];
  if (!String(formData.sim_number || '').trim()) errors.push('SIM number is required.');
  if (!String(formData.package_name || '').trim()) errors.push('Package name is required.');
  if (formData.activation_date && formData.expiry_date) {
    const activation = new Date(formData.activation_date);
    const expiry = new Date(formData.expiry_date);
    if (!Number.isNaN(activation.getTime()) && !Number.isNaN(expiry.getTime()) && expiry < activation) {
      errors.push('Expiry date must be on or after activation date.');
    }
  }
  return errors;
};

export const isItStock = (simCard) =>
  String(simCard?.current_user || '').trim().toUpperCase() === IT_STOCK_LABEL;

export const isUnassigned = (simCard) => {
  const user = String(simCard?.current_user || '').trim();
  return !user || isItStock(simCard);
};

export const getExpiryInfo = (expiryDate) => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Expired', tone: 'red', days: diffDays };
  }
  if (diffDays <= 30) {
    return { label: diffDays === 0 ? 'Expires today' : `${diffDays}d left`, tone: 'amber', days: diffDays };
  }
  return null;
};

export const isExpiringSoon = (simCard, withinDays = 30) => {
  const info = getExpiryInfo(simCard?.expiry_date);
  if (!info) return false;
  return info.days >= 0 && info.days <= withinDays;
};

export const isExpired = (simCard) => {
  const info = getExpiryInfo(simCard?.expiry_date);
  return info?.tone === 'red';
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-700/50';
    case 'Inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-700/50';
    case 'Suspended':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700/50';
    case 'Pending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700/50';
    case 'Expired':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200 border-gray-200 dark:border-gray-600/50';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200 border-gray-200 dark:border-gray-600/50';
  }
};

export const getPackageTypeColor = (type) => {
  switch (type) {
    case 'Custom':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700/50';
    case 'Corporate':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700/50';
    case 'Premium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700/50';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700/50';
  }
};

export const getExpiryBadgeClasses = (tone) => {
  if (tone === 'red') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-700/50';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-700/50';
};

export const filterSimCards = (simCards, filters) => {
  const {
    searchTerm = '',
    statusFilter = '',
    departmentFilter = '',
    packageTypeFilter = '',
    quickFilter = '',
    sortBy = 'newest',
  } = filters;

  const searchLower = searchTerm.toLowerCase();

  let result = simCards.filter((simCard) => {
    const matchesSearch =
      !searchTerm ||
      simCard.sim_number.toLowerCase().includes(searchLower) ||
      simCard.package_name.toLowerCase().includes(searchLower) ||
      (simCard.current_user && simCard.current_user.toLowerCase().includes(searchLower)) ||
      (simCard.previous_user && simCard.previous_user.toLowerCase().includes(searchLower)) ||
      (simCard.department && simCard.department.toLowerCase().includes(searchLower)) ||
      (simCard.designation && simCard.designation.toLowerCase().includes(searchLower)) ||
      (simCard.package_type && simCard.package_type.toLowerCase().includes(searchLower)) ||
      (simCard.status && simCard.status.toLowerCase().includes(searchLower));

    const matchesStatus = !statusFilter || simCard.status === statusFilter;
    const matchesDepartment = !departmentFilter || simCard.department === departmentFilter;
    const matchesPackageType = !packageTypeFilter || simCard.package_type === packageTypeFilter;

    let matchesQuick = true;
    if (quickFilter === 'active') matchesQuick = simCard.status === 'Active';
    else if (quickFilter === 'unassigned') matchesQuick = isUnassigned(simCard);
    else if (quickFilter === 'it_stock') matchesQuick = isItStock(simCard);
    else if (quickFilter === 'expiring') matchesQuick = isExpiringSoon(simCard);
    else if (quickFilter === 'expired') matchesQuick = isExpired(simCard);

    return matchesSearch && matchesStatus && matchesDepartment && matchesPackageType && matchesQuick;
  });

  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case 'expiry_asc': {
        const da = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const db = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        return da - db;
      }
      case 'cost_desc':
        return (parseFloat(b.monthly_cost) || 0) - (parseFloat(a.monthly_cost) || 0);
      case 'sim_number':
        return String(a.sim_number).localeCompare(String(b.sim_number));
      case 'newest':
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

  return result;
};

export const QUICK_FILTERS = [
  { id: '', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'it_stock', label: 'IT Stock' },
  { id: 'expiring', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'sim_number', label: 'SIM number' },
  { value: 'expiry_asc', label: 'Expiry date' },
  { value: 'cost_desc', label: 'Highest cost' },
];
