// Utility functions for employee data processing

/**
 * Derive employee status from available database fields
 * @param {Object} employee - Employee object with performance_rating and termination_date
 * @returns {string} Derived status
 */
export const deriveEmployeeStatus = (employee) => {
  if (employee.termination_date) {
    return 'terminated';
  }
  
  if (employee.performance_rating) {
    if (employee.performance_rating >= 4.5) {
      return 'excellent';
    } else if (employee.performance_rating >= 3.5) {
      return 'good';
    } else if (employee.performance_rating >= 2.5) {
      return 'average';
    } else {
      return 'needs_improvement';
    }
  }
  
  return 'active';
};

/**
 * Get status color based on derived status
 * @param {string} status - Derived status
 * @returns {string} CSS classes for styling
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'excellent':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'good':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'average':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'needs_improvement':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'terminated':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'active':
    default:
      return 'bg-green-100 text-green-800 border-green-200';
  }
};

/**
 * Get status icon based on derived status
 * @param {string} status - Derived status
 * @returns {string} Icon name or component
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case 'excellent':
      return 'star';
    case 'good':
      return 'check-circle';
    case 'average':
      return 'clock';
    case 'needs_improvement':
      return 'alert-triangle';
    case 'terminated':
      return 'x-circle';
    case 'active':
    default:
      return 'check-circle';
  }
};

/**
 * Format status for display
 * @param {string} status - Derived status
 * @returns {string} Formatted status text
 */
export const formatStatus = (status) => {
  switch (status) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'average':
      return 'Average';
    case 'needs_improvement':
      return 'Needs Improvement';
    case 'terminated':
      return 'Terminated';
    case 'active':
    default:
      return 'Active';
  }
};
