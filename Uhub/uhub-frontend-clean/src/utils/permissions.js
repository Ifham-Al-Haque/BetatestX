// Permission utility functions for role-based access control

/**
 * Check if user can perform specific operations on employee records
 * @param {string} userRole - The user's role
 * @param {string} operation - The operation to check (read, create, update, delete)
 * @returns {boolean} - Whether the user can perform the operation
 */
export const canPerformEmployeeOperation = (userRole, operation) => {
  if (!userRole) return false;

  const permissions = {
    admin: ['read', 'create', 'update', 'delete'],
    manager: ['read', 'create', 'update', 'delete'],
    cs_manager: ['read', 'create', 'update'],
    hr_manager: ['read'], // HR Managers can only read
    driver_management: ['read'],
    employee: ['read'],
    viewer: ['read']
  };

  return permissions[userRole]?.includes(operation) || false;
};

/**
 * Check if user can view employee records
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user can view employees
 */
export const canViewEmployees = (userRole) => {
  return canPerformEmployeeOperation(userRole, 'read');
};

/**
 * Check if user can create employee records
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user can create employees
 */
export const canCreateEmployees = (userRole) => {
  return canPerformEmployeeOperation(userRole, 'create');
};

/**
 * Check if user can edit employee records
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user can edit employees
 */
export const canEditEmployees = (userRole) => {
  return canPerformEmployeeOperation(userRole, 'update');
};

/**
 * Check if user can delete employee records
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user can delete employees
 */
export const canDeleteEmployees = (userRole) => {
  return canPerformEmployeeOperation(userRole, 'delete');
};

/**
 * Get all permissions for a specific role
 * @param {string} userRole - The user's role
 * @returns {object} - Object containing all permissions for the role
 */
export const getRolePermissions = (userRole) => {
  if (!userRole) return {};

  return {
    canView: canViewEmployees(userRole),
    canCreate: canCreateEmployees(userRole),
    canEdit: canEditEmployees(userRole),
    canDelete: canDeleteEmployees(userRole),
    isReadOnly: !canEditEmployees(userRole) && !canDeleteEmployees(userRole),
    isHRManager: userRole === 'hr_manager'
  };
};

/**
 * Check if user has admin or manager privileges
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user has elevated privileges
 */
export const hasElevatedPrivileges = (userRole) => {
  return ['admin', 'manager'].includes(userRole);
};

/**
 * Check if user has HR-related privileges
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user has HR privileges
 */
export const hasHRPrivileges = (userRole) => {
  return ['admin', 'manager', 'hr_manager'].includes(userRole);
};

/**
 * Get display text for permission denied messages
 * @param {string} operation - The operation that was denied
 * @param {string} userRole - The user's role
 * @returns {string} - User-friendly permission denied message
 */
export const getPermissionDeniedMessage = (operation, userRole) => {
  const roleDisplayNames = {
    admin: 'Administrator',
    manager: 'Manager',
    cs_manager: 'Customer Service Manager',
    hr_manager: 'HR Manager',
    driver_management: 'Driver Management',
    employee: 'Employee',
    viewer: 'Viewer'
  };

  const roleName = roleDisplayNames[userRole] || userRole;

  switch (operation) {
    case 'create':
      return `As a ${roleName}, you can only view employee records. Creating new employees requires elevated privileges.`;
    case 'update':
      return `As a ${roleName}, you can only view employee records. Editing employees requires elevated privileges.`;
    case 'delete':
      return `As a ${roleName}, you can only view employee records. Deleting employees requires administrator privileges.`;
    default:
      return `You don't have permission to perform this operation.`;
  }
};
