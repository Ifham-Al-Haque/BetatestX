import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash, Search, Filter, Phone, User, Building,
  Wifi, Signal, CreditCard, Download,
  X, Save, Users, AlertCircle,
  TrendingUp, FileText, FileSpreadsheet,
  RefreshCw, ChevronDown, Grid, List, Calendar, Clock, Package
} from "lucide-react";
import { useSimCards, useCreateSimCard, useUpdateSimCard, useDeleteSimCard, useSimCardStats, useSearchSimCards } from "../hooks/useSimCards";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { DEPARTMENTS, getDepartmentLabel } from "../config/departments";
import DepartmentManager from "../components/DepartmentManager";
import ExportModal from "../components/ExportModal";
import EmployeeSearchPicker from "../components/simcards/EmployeeSearchPicker";
import PaginationControls from "../components/ui/PaginationControls";
import { CardSkeleton, StatsSkeleton } from "../components/LoadingSkeleton";
import { supabase } from "../supabaseClient";
import { useQueryClient } from '@tanstack/react-query';
import { exportFilteredData } from "../utils/exportUtils";
import {
  filterSimCards,
  getDepartmentBadgeClasses,
  getExpiryBadgeClasses,
  getExpiryInfo,
  getPackageTypeColor,
  getStatusColor,
  isItStock,
  isUnassigned,
  isExpiringSoon,
  QUICK_FILTERS,
  SORT_OPTIONS,
  applyEmployeeAssignment,
  applyItStockAssignment,
  validateSimCardForm,
  IT_STOCK_LABEL,
} from "../utils/simCardUtils";
import { canManageSimCards, canDeleteSimCards, resolveUserRole } from "../utils/simCardPermissions";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const PAGE_SIZE = 18;
const FETCH_LIMIT = 2000;

const FORM_TABS = [
  { id: 'details', label: 'SIM Details', icon: Phone },
  { id: 'package', label: 'Package', icon: Package },
  { id: 'assignment', label: 'Assignment', icon: User },
  { id: 'notes', label: 'Notes', icon: FileText },
];

// SIM Card Form Component
const SimCardForm = ({ simCard, onClose, onSubmit, isLoading }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('details');
  const [formErrors, setFormErrors] = useState([]);
  const [formData, setFormData] = useState({
    sim_number: simCard?.sim_number || "",
    package_name: simCard?.package_name || "",
    package_type: simCard?.package_type || "Default",
    package_benefits: simCard?.package_benefits || "",
    monthly_cost: simCard?.monthly_cost || "",
    data_limit: simCard?.data_limit || "",
    voice_minutes: simCard?.voice_minutes || "",
    sms_limit: simCard?.sms_limit || "",
    current_user: simCard?.current_user || "",
    assigned_employee_id: simCard?.assigned_employee_id || "",
    assigned_employee_name: simCard?.assigned_employee_name || "",
    assigned_employee_email: simCard?.assigned_employee_email || "",
    previous_user: simCard?.previous_user || "",
    department: simCard?.department || "",
    designation: simCard?.designation || "",
    status: simCard?.status || "Active",
    activation_date: simCard?.activation_date || "",
    expiry_date: simCard?.expiry_date || "",
    notes: simCard?.notes || ""
  });
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadEmployees = async () => {
      setEmployeesLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, employee_id, email, department, position')
        .order('full_name', { ascending: true })
        .limit(1000);

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load employees for SIM assignment:', error);
        setEmployees([]);
      } else {
        setEmployees(Array.isArray(data) ? data : []);
      }
      setEmployeesLoading(false);
    };

    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!employees.length || formData.assigned_employee_id || !formData.current_user) return;
    const current = String(formData.current_user).toLowerCase();
    const matchedEmployee = employees.find((employee) => {
      const name = String(employee.full_name || '').toLowerCase();
      const employeeId = String(employee.employee_id || '').toLowerCase();
      const email = String(employee.email || '').toLowerCase();
      return (name && current.includes(name)) || (employeeId && current.includes(employeeId)) || (email && current.includes(email));
    });

    if (matchedEmployee) {
      setFormData((prev) => ({
        ...prev,
        assigned_employee_id: matchedEmployee.employee_id || matchedEmployee.id || '',
        assigned_employee_name: matchedEmployee.full_name || '',
        assigned_employee_email: matchedEmployee.email || '',
      }));
    }
  }, [employees, formData.assigned_employee_id, formData.current_user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmployeeAssignChange = (selectedEmployee) => {
    if (!selectedEmployee) {
      setFormData((prev) => applyEmployeeAssignment(prev, null));
      return;
    }
    setFormData((prev) => applyEmployeeAssignment(prev, selectedEmployee));
  };

  const handleItStock = () => {
    setFormData((prev) => applyItStockAssignment(prev));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateSimCardForm(formData);
    setFormErrors(errors);
    if (errors.length) {
      setActiveTab(errors.some((msg) => msg.includes('SIM') || msg.includes('Package')) ? 'details' : 'assignment');
      return;
    }
    onSubmit(formData);
  };

  const fieldClass = (extra = '') =>
    `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
      isDark
        ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-teal-400 hover:border-slate-500'
        : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 hover:border-gray-400'
    } ${extra}`;

  const labelClass = `block text-sm font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border transition-all duration-300 ${
          isDark 
            ? 'bg-slate-800/90 border-slate-700/50' 
            : 'bg-white border-gray-200/20'
        }`}
      >
        <div className={`p-8 border-b rounded-t-2xl ${
          isDark ? 'border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700' : 'border-gray-200/50 bg-gradient-to-r from-teal-50 to-cyan-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-teal-900/50' : 'bg-teal-100'}`}>
                <Phone className={`w-6 h-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {simCard ? 'Edit SIM Card' : 'Add New SIM Card'}
                </h2>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  {simCard ? 'Update SIM card information' : 'Create a new SIM card for your organization'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'text-slate-400 hover:bg-slate-700/50' : 'text-gray-400 hover:bg-gray-100'}`}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
          <div className={`flex flex-wrap gap-2 p-1 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
            {FORM_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : isDark ? 'text-slate-300 hover:bg-slate-600' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {formErrors.length > 0 && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3">
              {formErrors.map((msg) => (
                <p key={msg} className="text-sm text-red-700 dark:text-red-300">{msg}</p>
              ))}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>SIM Number *</label>
                <input type="text" name="sim_number" value={formData.sim_number} onChange={handleChange} required className={fieldClass()} placeholder="Enter SIM number" />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={fieldClass()}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Activation Date</label>
                <input type="date" name="activation_date" value={formData.activation_date} onChange={handleChange} className={fieldClass()} />
              </div>
              <div>
                <label className={labelClass}>Expiry Date</label>
                <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className={fieldClass()} />
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <select name="department" value={formData.department} onChange={handleChange} className={fieldClass()}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="Job title or position" className={fieldClass()} />
              </div>
            </div>
          )}

          {activeTab === 'package' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Package Name *</label>
                <input type="text" name="package_name" value={formData.package_name} onChange={handleChange} required className={fieldClass()} placeholder="Enter package name" />
              </div>
              <div>
                <label className={labelClass}>Package Type</label>
                <select name="package_type" value={formData.package_type} onChange={handleChange} className={fieldClass()}>
                  <option value="Default">Default</option>
                  <option value="Custom">Custom Made</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Premium">Premium</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Monthly Cost (AED)</label>
                <input type="number" name="monthly_cost" value={formData.monthly_cost} onChange={handleChange} className={fieldClass()} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className={labelClass}>Data Limit</label>
                <input type="text" name="data_limit" value={formData.data_limit} onChange={handleChange} className={fieldClass()} placeholder="e.g., 10GB" />
              </div>
              <div>
                <label className={labelClass}>Voice Minutes</label>
                <input type="text" name="voice_minutes" value={formData.voice_minutes} onChange={handleChange} className={fieldClass()} placeholder="e.g., 1000" />
              </div>
              <div>
                <label className={labelClass}>SMS Limit</label>
                <input type="text" name="sms_limit" value={formData.sms_limit} onChange={handleChange} className={fieldClass()} placeholder="e.g., 500" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Package Benefits</label>
                <textarea name="package_benefits" value={formData.package_benefits} onChange={handleChange} rows="3" className={fieldClass()} placeholder="Describe package benefits..." />
              </div>
            </div>
          )}

          {activeTab === 'assignment' && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Assign to Employee</label>
                <EmployeeSearchPicker
                  value={formData.assigned_employee_id}
                  employees={employees}
                  loading={employeesLoading}
                  isDark={isDark}
                  onSelect={handleEmployeeAssignChange}
                  onClear={() => handleEmployeeAssignChange(null)}
                />
                <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Search by name, employee ID, or email. Previous user is set automatically on reassignment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleItStock}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    formData.current_user === IT_STOCK_LABEL
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Mark as IT Stock
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Current User</label>
                  <input type="text" name="current_user" value={formData.current_user} onChange={handleChange} className={fieldClass()} placeholder="Assigned user display name" />
                </div>
                <div>
                  <label className={labelClass}>Previous User</label>
                  <input type="text" name="previous_user" value={formData.previous_user} onChange={handleChange} className={fieldClass()} placeholder="Previous assignee" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className={labelClass}>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="5" className={fieldClass()} placeholder="Additional notes..." />
            </div>
          )}

          <div className={`flex items-center justify-end gap-4 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <button type="button" onClick={onClose} className={`px-6 py-3 border rounded-xl font-medium ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 font-medium shadow-lg">
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : (simCard ? 'Update SIM Card' : 'Create SIM Card')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// List row for table/list view
const SimCardListRow = ({ simCard, onEdit, onDelete, isDark, canEdit, canDelete, onView }) => {
  const expiryInfo = getExpiryInfo(simCard.expiry_date);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(simCard.id)}
      onKeyDown={(e) => e.key === 'Enter' && onView(simCard.id)}
      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
        isDark ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600' : 'bg-white border-gray-200/80 hover:border-blue-200'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shrink-0">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className={`font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{simCard.sim_number}</p>
          <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{simCard.package_name}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(simCard.status)}`}>{simCard.status}</span>
        {expiryInfo && (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getExpiryBadgeClasses(expiryInfo.tone)}`}>{expiryInfo.label}</span>
        )}
        <span className={`text-sm truncate max-w-[140px] ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          {simCard.current_user || 'Unassigned'}
        </span>
        <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>AED {simCard.monthly_cost || 0}</span>
        {(canEdit || canDelete) && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
              <button type="button" onClick={() => onEdit(simCard)} className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={() => onDelete(simCard.id)} className={`p-2 rounded-lg ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'}`}>
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced SIM Card Component
const SimCard = ({ simCard, onEdit, onDelete, isDark, canEdit, canDelete, onView }) => {
  const expiryInfo = getExpiryInfo(simCard.expiry_date);
  const assigneeInitial = (simCard.current_user || 'U').charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onView(simCard.id)}
      className={`rounded-2xl shadow-lg hover:shadow-xl border p-5 transition-all duration-300 group cursor-pointer ${
        isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200/50'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-lg font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              {simCard.sim_number}
            </h3>
            <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{simCard.package_name}</p>
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
              <button type="button" onClick={() => onEdit(simCard)} className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-800' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={() => onDelete(simCard.id)} className={`p-2 rounded-lg ${isDark ? 'bg-red-900/50 text-red-400 hover:bg-red-800' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(simCard.status)}`}>{simCard.status}</span>
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getPackageTypeColor(simCard.package_type)}`}>{simCard.package_type}</span>
        {expiryInfo && (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border inline-flex items-center gap-1 ${getExpiryBadgeClasses(expiryInfo.tone)}`}>
            <Clock className="w-3 h-3" />
            {expiryInfo.label}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Monthly Cost</span>
          <span className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>AED {simCard.monthly_cost || 0}</span>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            isUnassigned(simCard) ? (isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600') : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
          }`}>
            {assigneeInitial}
          </div>
          <div className="min-w-0">
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Assigned to</p>
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              {simCard.current_user || 'Unassigned'}
            </p>
          </div>
        </div>

        {simCard.department && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Department</span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getDepartmentBadgeClasses(simCard.department)}`}>
              {getDepartmentLabel(simCard.department)}
            </span>
          </div>
        )}
        {simCard.designation && (
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm shrink-0 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Designation</span>
            <span className={`text-sm font-medium truncate ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{simCard.designation}</span>
          </div>
        )}
      </div>

      {(simCard.data_limit || simCard.voice_minutes) && (
        <div className={`pt-3 border-t grid grid-cols-2 gap-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          {simCard.data_limit && (
            <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <Wifi className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Data</p>
              <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{simCard.data_limit}</p>
            </div>
          )}
          {simCard.voice_minutes && (
            <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <Phone className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Voice</p>
              <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{simCard.voice_minutes}</p>
            </div>
          )}
        </div>
      )}

      <div className={`pt-3 mt-3 border-t flex items-center justify-between text-xs ${isDark ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-gray-400'}`}>
        <span>{simCard.activation_date ? `Active: ${simCard.activation_date}` : '—'}</span>
        <span>{simCard.expiry_date ? `Expires: ${simCard.expiry_date}` : '—'}</span>
      </div>
    </motion.div>
  );
};

export default function Simcard() {
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [showForm, setShowForm] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: simCards = [], isLoading, error, refetch } = useSimCards();
  const { data: searchResults, isFetching: isSearching } = useSearchSimCards(searchTerm.trim().length >= 2 ? searchTerm.trim() : '');
  const { data: stats } = useSimCardStats();
  const createSimCard = useCreateSimCard();
  const updateSimCard = useUpdateSimCard();
  const deleteSimCard = useDeleteSimCard();

  const dataSource = searchTerm.trim().length >= 2 ? (searchResults || []) : simCards;

  const filteredSimCards = useMemo(
    () => filterSimCards(dataSource, { searchTerm, statusFilter, departmentFilter, packageTypeFilter, quickFilter, sortBy }),
    [dataSource, searchTerm, statusFilter, departmentFilter, packageTypeFilter, quickFilter, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(filteredSimCards.length / PAGE_SIZE));
  const paginatedSimCards = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSimCards.slice(start, start + PAGE_SIZE);
  }, [filteredSimCards, currentPage]);

  const atFetchLimit = simCards.length >= FETCH_LIMIT;
  const userRole = resolveUserRole(user, userProfile);
  const canManage = canManageSimCards(userRole);
  const canDelete = canDeleteSimCards(userRole);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, packageTypeFilter, quickFilter, sortBy]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !simCards.length) return;
    const card = simCards.find((s) => String(s.id) === editId);
    if (card) {
      setEditingSimCard(card);
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, simCards, setSearchParams]);

  const handleViewSimCard = useCallback((id) => {
    navigate(`/simcards/${id}`);
  }, [navigate]);

  const handleAddSimCard = () => {
    setEditingSimCard(null);
    setShowForm(true);
  };

  const handleEditSimCard = (simCard) => {
    setEditingSimCard(simCard);
    setShowForm(true);
  };

  const handleDeleteSimCard = (simCardId) => {
    setDeleteConfirmId(simCardId);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteSimCard.mutate(deleteConfirmId, {
      onSuccess: () => {
        success('Deleted', 'SIM card removed successfully.');
        setDeleteConfirmId(null);
      },
      onError: (err) => {
        showError('Delete Failed', err.message);
        setDeleteConfirmId(null);
      },
    });
  };

  const handleSubmitSimCard = (formData) => {
    const simCardData = {
      ...formData,
      user_id: user?.id,
      monthly_cost: parseFloat(formData.monthly_cost) || 0,
      assigned_employee_id: formData.assigned_employee_id || null,
      assigned_employee_name: formData.assigned_employee_name || null,
      assigned_employee_email: formData.assigned_employee_email || null,
    };

    if (editingSimCard) {
      updateSimCard.mutate({ id: editingSimCard.id, ...simCardData }, {
        onSuccess: () => {
          success('Updated', 'SIM card updated successfully.');
          setShowForm(false);
          setEditingSimCard(null);
        },
        onError: (err) => showError('Update Failed', err.message),
      });
    } else {
      createSimCard.mutate(simCardData, {
        onSuccess: () => {
          success('Created', 'SIM card created successfully.');
          setShowForm(false);
          setEditingSimCard(null);
        },
        onError: (err) => showError('Create Failed', err.message),
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSimCard(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['simCards'] });
      await queryClient.invalidateQueries({ queryKey: ['simCardStats'] });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDepartmentFilter("");
    setPackageTypeFilter("");
    setQuickFilter("");
    setSortBy("newest");
  };

  const applyStatFilter = (filterId) => {
    clearAllFilters();
    if (filterId) setQuickFilter(filterId);
  };

  const canEditSimCard = useCallback(() => canManage, [canManage]);
  const canDeleteSimCard = useCallback(() => canDelete, [canDelete]);
  const canAddSimCard = useCallback(() => canManage, [canManage]);

  const handleExportComplete = () => {};

  const handleQuickExport = (format) => {
    exportFilteredData(simCards, {
      searchTerm, statusFilter, departmentFilter, packageTypeFilter,
    }, format);
    setShowExportMenu(false);
  };

  const expiringCount = stats?.expiring_soon ?? simCards.filter((s) => isExpiringSoon(s)).length;
  const itStockCount = simCards.filter((s) => isItStock(s)).length;
  const unassignedCount = simCards.filter((s) => isUnassigned(s)).length;

  const statCards = [
    { id: '', label: 'Total SIM Cards', value: stats?.total_sim_cards || simCards.length, sub: 'Across all departments', gradient: 'from-teal-500 to-cyan-600', icon: Phone },
    { id: 'active', label: 'Active', value: stats?.active_sim_cards || simCards.filter((s) => s.status === 'Active').length, sub: 'Currently operational', gradient: 'from-green-500 to-emerald-600', icon: Signal },
    { id: 'it_stock', label: 'IT Stock', value: itStockCount, sub: 'Available inventory', gradient: 'from-indigo-500 to-blue-600', icon: Wifi },
    { id: 'expiring', label: 'Expiring Soon', value: expiringCount, sub: 'Within 30 days', gradient: 'from-amber-500 to-orange-600', icon: Calendar },
    { id: '', label: 'Assigned', value: stats?.assigned_sim_cards || simCards.filter((s) => s.current_user && !isUnassigned(s)).length, sub: 'In use by employees', gradient: 'from-violet-500 to-purple-600', icon: Users },
    { id: '', label: 'Monthly Cost', value: `AED ${(stats?.total_monthly_cost || simCards.reduce((t, s) => t + (parseFloat(s.monthly_cost) || 0), 0)).toLocaleString()}`, sub: 'Total monthly spend', gradient: 'from-rose-500 to-pink-600', icon: CreditCard, isCost: true },
  ];

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-teal-50/20 to-cyan-50/30'
    } flex`}>
      <div className="flex-1 transition-all duration-300 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden rounded-2xl p-6 lg:p-8 shadow-xl border ${
                isDark ? 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600/50' : 'bg-gradient-to-br from-white to-teal-50/40 border-gray-200/50'
              }`}
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full blur-2xl translate-x-16 -translate-y-16" />
              </div>
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shrink-0">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      SIM Card Management
                    </h1>
                    <p className={`mt-2 text-base lg:text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                      Manage company SIM cards, packages, and employee assignments
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {expiringCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                          <Calendar className="w-3 h-3" />
                          {expiringCount} expiring soon
                        </span>
                      )}
                      {unassignedCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50">
                          <Users className="w-3 h-3" />
                          {unassignedCount} unassigned
                        </span>
                      )}
                      {atFetchLimit && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700/50">
                          <AlertCircle className="w-3 h-3" />
                          Showing latest {FETCH_LIMIT} records
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Refresh"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </motion.button>

                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowExportMenu((v) => !v)}
                      className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border transition-all ${
                        isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Export
                      <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </motion.button>
                    {showExportMenu && (
                      <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-20 py-1 ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                      }`}>
                        <button type="button" onClick={() => handleQuickExport('excel')} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                          <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel (CSV)
                        </button>
                        <button type="button" onClick={() => handleQuickExport('pdf')} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                          <FileText className="w-4 h-4 text-red-600" /> PDF
                        </button>
                        <button type="button" onClick={() => { setShowExportModal(true); setShowExportMenu(false); }} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                          <Download className="w-4 h-4 text-purple-600" /> More options
                        </button>
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDepartmentManager(true)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border transition-all ${
                      isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Departments
                  </motion.button>

                  {canAddSimCard() && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddSimCard}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl flex items-center gap-2 text-sm font-medium shadow-lg shadow-teal-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add SIM Card
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Filters */}
          <div className={`p-6 rounded-2xl shadow-xl border mb-8 transition-all duration-300 ${
            isDark 
              ? 'bg-slate-800/80 border-slate-700/50' 
              : 'bg-white border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Filter className={`w-5 h-5 transition-colors duration-300 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-slate-100' : 'text-gray-900'
                }`}>Filter & Search</h3>
              </div>
              <button
                onClick={clearAllFilters}
                className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${
                  isDark 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-5">
              {QUICK_FILTERS.map((qf) => (
                <button
                  key={qf.id || 'all'}
                  type="button"
                  onClick={() => setQuickFilter(qf.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    quickFilter === qf.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {qf.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative group">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  isDark ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search SIM cards (server search at 2+ chars)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent w-full transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 cursor-pointer ${
                  isDark 
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                }`}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 cursor-pointer ${
                  isDark 
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                }`}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>

              <select
                value={packageTypeFilter}
                onChange={(e) => setPackageTypeFilter(e.target.value)}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 cursor-pointer ${
                  isDark 
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                }`}
              >
                <option value="">All Package Types</option>
                <option value="Default">Default</option>
                <option value="Custom">Custom Made</option>
                <option value="Corporate">Corporate</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 cursor-pointer ${
                  isDark 
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-teal-400 hover:border-slate-500' 
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-teal-500 hover:border-gray-400'
                }`}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {isSearching && searchTerm.trim().length >= 2 && (
              <p className={`text-xs mt-3 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Searching full database...</p>
            )}
          </div>

          {isLoading && (
            <div className="space-y-8 mb-8">
              <StatsSkeleton />
              <CardSkeleton cards={6} />
            </div>
          )}

          {error && !isLoading && (
            <div className={`p-8 rounded-2xl shadow-xl border mb-8 ${
              isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200/50'
            }`}>
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Failed to load SIM cards</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{error.message}</p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium shadow-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {statCards.map((card, index) => {
                const Icon = card.icon;
                const isClickable = !!card.id;
                return (
                  <motion.button
                    key={card.label}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && applyStatFilter(card.id)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`text-left p-5 rounded-2xl shadow-lg bg-gradient-to-br ${card.gradient} text-white relative overflow-hidden group transition-transform ${
                      isClickable ? 'hover:scale-[1.03] cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        {isClickable && <TrendingUp className="w-4 h-4 opacity-60" />}
                      </div>
                      <p className="text-xs font-medium text-white/80 mb-0.5">{card.label}</p>
                      <p className={`font-bold text-white ${card.isCost ? 'text-xl' : 'text-2xl'}`}>{card.value}</p>
                      <p className="text-[10px] text-white/70 mt-1">{card.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
          {!isLoading && !error && (
            <div className={`p-6 lg:p-8 rounded-2xl shadow-xl border transition-all duration-300 ${
              isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-gray-200/50'
            }`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    SIM Cards ({filteredSimCards.length})
                  </h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Showing {paginatedSimCards.length} of {filteredSimCards.length} filtered · {simCards.length} loaded
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex rounded-xl border p-1 ${isDark ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white' : isDark ? 'text-slate-400' : 'text-gray-500'}`}
                      title="Grid view"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-600 text-white' : isDark ? 'text-slate-400' : 'text-gray-500'}`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {filteredSimCards.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                    <Phone className={`w-10 h-10 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No SIM cards found</h3>
                  <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {searchTerm || statusFilter || departmentFilter || packageTypeFilter || quickFilter
                      ? 'Try adjusting your filters or search terms'
                      : 'Get started by adding your first SIM card'}
                  </p>
                  {!searchTerm && !statusFilter && !departmentFilter && !packageTypeFilter && !quickFilter && canAddSimCard() && (
                    <button
                      type="button"
                      onClick={handleAddSimCard}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl inline-flex items-center gap-2 font-medium shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Add First SIM Card
                    </button>
                  )}
                </motion.div>
              ) : viewMode === 'list' ? (
                <div className="space-y-3">
                  {paginatedSimCards.map((simCard) => (
                    <SimCardListRow
                      key={simCard.id}
                      simCard={simCard}
                      onEdit={handleEditSimCard}
                      onDelete={handleDeleteSimCard}
                      onView={handleViewSimCard}
                      isDark={isDark}
                      canEdit={canEditSimCard()}
                      canDelete={canDeleteSimCard()}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <AnimatePresence>
                    {paginatedSimCards.map((simCard, index) => (
                      <motion.div
                        key={simCard.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.04, 0.4) }}
                        layout
                      >
                        <SimCard
                          simCard={simCard}
                          onEdit={handleEditSimCard}
                          onDelete={handleDeleteSimCard}
                          onView={handleViewSimCard}
                          isDark={isDark}
                          canEdit={canEditSimCard()}
                          canDelete={canDeleteSimCard()}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                totalItems={filteredSimCards.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                className="mt-6"
              />
            </div>
          )}

          {/* Delete confirmation */}
          <AnimatePresence>
            {deleteConfirmId && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl shadow-2xl p-6 max-w-md w-full border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                      <Trash className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Delete SIM card?</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleteSimCard.isPending}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {deleteSimCard.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SIM Card Form Modal */}
          <AnimatePresence>
            {showForm && (
              <SimCardForm
                simCard={editingSimCard}
                onClose={handleCloseForm}
                onSubmit={handleSubmitSimCard}
                isLoading={createSimCard.isPending || updateSimCard.isPending}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Department Manager Modal */}
        <DepartmentManager
          isOpen={showDepartmentManager}
          onClose={() => setShowDepartmentManager(false)}
          onDepartmentsChange={(updatedDepartments) => {
            // You can implement logic here to update the departments globally
            console.log('Departments updated:', updatedDepartments);
          }}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          simCards={simCards}
          filters={{
            searchTerm,
            statusFilter,
            departmentFilter,
            packageTypeFilter
          }}
          onExportComplete={handleExportComplete}
        />
      </div>
    </div>
  );
} 
