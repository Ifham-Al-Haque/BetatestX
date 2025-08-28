import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, Plus, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  canEditEmployees, 
  canDeleteEmployees, 
  canCreateEmployees,
  getRolePermissions,
  getPermissionDeniedMessage 
} from '../utils/permissions';

/**
 * Component that renders employee action buttons based on user permissions
 * HR Managers will only see view buttons, no edit/delete actions
 */
export default function EmployeeActionButtons({ 
  employee, 
  onEdit, 
  onDelete, 
  onView, 
  onCreate,
  showCreate = true,
  showView = true,
  showEdit = true,
  showDelete = true,
  className = "",
  size = "default" // "small", "default", "large"
}) {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  
  // Get permissions for the current user
  const permissions = getRolePermissions(userRole);
  
  // Determine button sizes based on size prop
  const buttonSizes = {
    small: {
      button: "px-2 py-1 text-xs",
      icon: "w-3 h-3"
    },
    default: {
      button: "px-3 py-2 text-sm",
      icon: "w-4 h-4"
    },
    large: {
      button: "px-4 py-3 text-base",
      icon: "w-5 h-5"
    }
  };
  
  const { button: buttonSize, icon: iconSize } = buttonSizes[size] || buttonSizes.default;

  // Check if user can perform actions
  const canEdit = showEdit && canEditEmployees(userRole);
  const canDelete = showDelete && canDeleteEmployees(userRole);
  const canCreate = showCreate && canCreateEmployees(userRole);
  const canView = showView && permissions.canView;

  // If no permissions, show nothing
  if (!canView && !canEdit && !canDelete && !canCreate) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">View Only</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* View Button - Always visible if user can view */}
      {canView && onView && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onView(employee)}
          className={`flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition-colors ${buttonSize}`}
          title="View employee details"
        >
          <Eye className={iconSize} />
          <span>View</span>
        </motion.button>
      )}

      {/* Create Button */}
      {canCreate && onCreate && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreate}
          className={`flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-lg transition-colors ${buttonSize}`}
          title="Create new employee"
        >
          <UserPlus className={iconSize} />
          <span>Create</span>
        </motion.button>
      )}

      {/* Edit Button - Hidden for HR Managers */}
      {canEdit && onEdit && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(employee)}
          className={`flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-lg transition-colors ${buttonSize}`}
          title="Edit employee"
        >
          <Edit className={iconSize} />
          <span>Edit</span>
        </motion.button>
      )}

      {/* Delete Button - Hidden for HR Managers */}
      {canDelete && onDelete && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(employee)}
          className={`flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors ${buttonSize}`}
          title="Delete employee"
        >
          <Trash2 className={iconSize} />
          <span>Delete</span>
        </motion.button>
      )}

      {/* Permission Notice for HR Managers */}
      {permissions.isHRManager && (showEdit || showDelete) && (
        <div className="flex items-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 border border-purple-200 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">HR Manager - View Only</span>
        </div>
      )}
    </div>
  );
}

/**
 * Specialized component for employee list actions
 */
export function EmployeeListActions({ employee, onEdit, onDelete, onView }) {
  return (
    <EmployeeActionButtons
      employee={employee}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      showCreate={false}
      size="small"
    />
  );
}

/**
 * Specialized component for employee profile actions
 */
export function EmployeeProfileActions({ employee, onEdit, onDelete, onView }) {
  return (
    <EmployeeActionButtons
      employee={employee}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      showCreate={false}
      size="default"
    />
  );
}

/**
 * Component for page-level employee actions (like Create button)
 */
export function EmployeePageActions({ onCreate, userRole }) {
  const canCreate = canCreateEmployees(userRole);
  
  if (!canCreate) return null;
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onCreate}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
    >
      <Plus className="w-4 h-4" />
      <span>Add Employee</span>
    </motion.button>
  );
}
