import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Edit, Trash2, Eye, MoreVertical, Star,
  CheckCircle, AlertTriangle, Clock, XCircle, ChevronRight
} from 'lucide-react';

const EnhancedEmployeeCard = ({ employee, onEdit, onDelete, onView, onStatusChange }) => {
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return <Star className="w-4 h-4" />;
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'average':
        return <Clock className="w-4 h-4" />;
      case 'needs_improvement':
        return <AlertTriangle className="w-4 h-4" />;
      case 'terminated':
        return <XCircle className="w-4 h-4" />;
      case 'active':
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const deriveEmployeeStatus = (emp) => {
    if (emp.termination_date) {
      return 'terminated';
    }
    
    if (emp.performance_rating) {
      if (emp.performance_rating >= 4.5) {
        return 'excellent';
      } else if (emp.performance_rating >= 3.5) {
        return 'good';
      } else if (emp.performance_rating >= 2.5) {
        return 'average';
      } else {
        return 'needs_improvement';
      }
    }
    
    return 'active';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(employee.id, newStatus);
    }
    setShowActions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <div className="relative">
              {employee.profile_picture ? (
                <img
                  src={employee.profile_picture}
                  alt={employee.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200 ${
                  employee.profile_picture ? 'hidden' : 'flex'
                }`}
              >
                {getInitials(employee.full_name)}
              </div>
              
              {/* Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${getStatusColor(deriveEmployeeStatus(employee))}`}>
                {getStatusIcon(deriveEmployeeStatus(employee))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {employee.full_name}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {employee.position || 'Position not set'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {employee.employee_id || 'ID not set'}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Actions Dropdown */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        onView(employee);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => {
                        onEdit(employee);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    
                    {/* Status Change Options */}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <p className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Change Status
                      </p>
                      {['active', 'excellent', 'good', 'average', 'needs_improvement', 'terminated'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            deriveEmployeeStatus(employee) === status ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                        >
                          {getStatusIcon(status)}
                          <span className="capitalize">{status}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <button
                        onClick={() => {
                          onDelete(employee.id);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Department</p>
            <p className="text-sm font-semibold text-gray-900">
              {employee.department || 'Unassigned'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Performance</p>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
              {employee.performance_rating ? `${employee.performance_rating}/5` : 'Not Rated'}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="space-y-3">
          {employee.email && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.location && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{employee.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Additional Details Toggle */}
      <div className="px-6 py-4 border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors"
        >
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="p-6 space-y-4">
              {/* Reporting Manager */}
              {employee.reporting_manager && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Reporting Manager
                  </p>
                  <p className="text-sm text-gray-900">
                    {employee.reporting_manager.full_name || employee.reporting_manager.name}
                  </p>
                </div>
              )}

              {/* Hire Date */}
              {employee.hire_date && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Hire Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(employee.hire_date)}
                  </p>
                </div>
              )}

              {/* Created Date */}
              {employee.created_at && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Added to System
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(employee.created_at)}
                  </p>
                </div>
              )}

              {/* Key Responsibilities */}
              {employee.key_roles && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Key Responsibilities
                  </p>
                  <p className="text-sm text-gray-900 line-clamp-3">
                    {Array.isArray(employee.key_roles) 
                      ? employee.key_roles.join(', ')
                      : employee.key_roles
                    }
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onView(employee)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Profile</span>
                  </button>
                  <button
                    onClick={() => onEdit(employee)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedEmployeeCard;
