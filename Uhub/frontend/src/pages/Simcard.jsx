import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash, Search, Filter, Phone, User, Building,
  Wifi, Signal, Calendar, Package, CreditCard, Download,
  X, Save, Users, MapPin, Clock, AlertCircle, Loader2,
  BarChart3, TrendingUp, Activity, Zap, Shield
} from "lucide-react";
import { useSimCards, useCreateSimCard, useUpdateSimCard, useDeleteSimCard, useSimCardStats } from "../hooks/useSimCards";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { DEPARTMENTS, getDepartmentLabel, getDepartmentColor } from "../config/departments";
import DepartmentManager from "../components/DepartmentManager";
import { supabase } from "../supabaseClient";
import { useQueryClient } from '@tanstack/react-query';

// SIM Card Form Component
const SimCardForm = ({ simCard, onClose, onSubmit, isLoading }) => {
  const { isDark } = useTheme();
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
    previous_user: simCard?.previous_user || "",
    department: simCard?.department || "",
    status: simCard?.status || "Active",
    activation_date: simCard?.activation_date || "",
    expiry_date: simCard?.expiry_date || "",
    notes: simCard?.notes || ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
        <div className={`p-8 border-b rounded-t-2xl transition-all duration-300 ${
          isDark 
            ? 'border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700' 
            : 'border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                isDark ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Phone className={`w-6 h-6 transition-colors duration-300 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {simCard ? "Edit SIM Card" : "Add New SIM Card"}
                </h2>
                <p className={`mt-1 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  {simCard ? "Update SIM card information" : "Create a new SIM card for your organization"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  SIM Number *
                </label>
                <input
                  type="text"
                  name="sim_number"
                  value={formData.sim_number}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter SIM number"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Package Name *
                </label>
                <input
                  type="text"
                  name="package_name"
                  value={formData.package_name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter package name"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Package Type
                </label>
                <select
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                >
                  <option value="Default">Default</option>
                  <option value="Custom">Custom Made</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Premium">Premium</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Monthly Cost (AED)
                </label>
                <input
                  type="number"
                  name="monthly_cost"
                  value={formData.monthly_cost}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Data Limit
                </label>
                <input
                  type="text"
                  name="data_limit"
                  value={formData.data_limit}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="e.g., 10GB"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Voice Minutes
                </label>
                <input
                  type="text"
                  name="voice_minutes"
                  value={formData.voice_minutes}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Current User
                </label>
                <input
                  type="text"
                  name="current_user"
                  value={formData.current_user}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter current user name"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Previous User
                </label>
                <input
                  type="text"
                  name="previous_user"
                  value={formData.previous_user}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter previous user name"
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Activation Date
                </label>
                <input
                  type="date"
                  name="activation_date"
                  value={formData.activation_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-gray-700'
                }`}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                      : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
              isDark ? 'text-slate-200' : 'text-gray-700'
            }`}>
              Package Benefits
            </label>
            <textarea
              name="package_benefits"
              value={formData.package_benefits}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                isDark 
                  ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
              }`}
              placeholder="Describe package benefits..."
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
              isDark ? 'text-slate-200' : 'text-gray-700'
            }`}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 ${
                isDark 
                  ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-blue-400 hover:border-slate-500' 
                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 hover:border-gray-400'
              }`}
              placeholder="Additional notes..."
            />
          </div>

          <div className={`flex items-center justify-end gap-4 pt-8 border-t transition-all duration-300 ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 border rounded-xl transition-all duration-300 font-medium ${
                isDark 
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl ${
                isDark ? 'shadow-blue-500/25' : 'shadow-blue-500/20'
              }`}
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : (simCard ? "Update SIM Card" : "Create SIM Card")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Enhanced SIM Card Component
const SimCard = ({ simCard, onEdit, onDelete, isDark, canEdit, canDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-700/50';
      case 'Inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-700/50';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700/50';
      case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700/50';
      case 'Expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200 border-gray-200 dark:border-gray-600/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200 border-gray-200 dark:border-gray-600/50';
    }
  };

  const getPackageTypeColor = (type) => {
    switch (type) {
      case 'Custom': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 dark:border-purple-700/50';
      case 'Corporate': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700/50';
      case 'Premium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700/50';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-700/50';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`rounded-2xl shadow-lg hover:shadow-2xl border p-6 transition-all duration-300 group cursor-pointer ${
        isDark 
          ? 'bg-slate-800/80 border-slate-700/50' 
          : 'bg-white border-gray-200/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold group-hover:text-blue-600 transition-colors duration-300 ${
              isDark ? 'text-slate-100 group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'
            }`}>
              {simCard.sim_number}
            </h3>
            <p className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {simCard.package_name}
            </p>
          </div>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {canEdit && (
              <button
                onClick={() => onEdit(simCard)}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  isDark 
                    ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-800' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(simCard.id)}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  isDark 
                    ? 'bg-red-900/50 text-red-400 hover:bg-red-800' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                <Trash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status and Package Type */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(simCard.status)}`}>
          {simCard.status}
        </span>
        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getPackageTypeColor(simCard.package_type)}`}>
          {simCard.package_type}
        </span>
      </div>

      {/* Key Information */}
      <div className="space-y-4 mb-6">
        <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
        }`}>
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>Monthly Cost</span>
          <span className={`text-lg font-bold transition-colors duration-300 ${
            isDark ? 'text-slate-100' : 'text-gray-900'
          }`}>
            AED {simCard.monthly_cost}
          </span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
        }`}>
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>Current User</span>
          <span className={`text-sm font-semibold max-w-32 truncate transition-colors duration-300 ${
            isDark ? 'text-slate-100' : 'text-gray-900'
          }`}>
            {simCard.current_user || 'Unassigned'}
          </span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
        }`}>
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>Department</span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full bg-${getDepartmentColor(simCard.department)}-100 dark:bg-${getDepartmentColor(simCard.department)}-900 text-${getDepartmentColor(simCard.department)}-800 dark:text-${getDepartmentColor(simCard.department)}-200`}>
            {simCard.department ? getDepartmentLabel(simCard.department) : 'Not specified'}
          </span>
        </div>
      </div>

      {/* Additional Details */}
      {(simCard.data_limit || simCard.voice_minutes) && (
        <div className={`pt-4 border-t transition-all duration-300 ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-2 gap-3">
            {simCard.data_limit && (
              <div className={`text-center p-2 rounded-lg transition-all duration-300 ${
                isDark ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}>
                <Wifi className={`w-4 h-4 mx-auto mb-1 transition-colors duration-300 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <p className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>Data</p>
                <p className={`text-sm font-bold transition-colors duration-300 ${
                  isDark ? 'text-slate-100' : 'text-gray-900'
                }`}>{simCard.data_limit}</p>
              </div>
            )}
            {simCard.voice_minutes && (
              <div className={`text-center p-2 rounded-lg transition-all duration-300 ${
                isDark ? 'bg-green-900/20' : 'bg-green-50'
              }`}>
                <Phone className={`w-4 h-4 mx-auto mb-1 transition-colors duration-300 ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`} />
                <p className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>Voice</p>
                <p className={`text-sm font-bold transition-colors duration-300 ${
                  isDark ? 'text-slate-100' : 'text-gray-900'
                }`}>{simCard.voice_minutes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {simCard.notes && (
        <div className={`pt-4 border-t mt-4 transition-all duration-300 ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <p className={`text-sm italic transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-gray-600'
          }`}>
            "{simCard.notes}"
          </p>
        </div>
      )}

      {/* Dates */}
      <div className={`pt-4 border-t mt-4 transition-all duration-300 ${
        isDark ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className={`flex items-center justify-between text-xs transition-colors duration-300 ${
          isDark ? 'text-slate-400' : 'text-gray-500'
        }`}>
          <span>Activated: {simCard.activation_date}</span>
          <span>Expires: {simCard.expiry_date}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default function Simcard() {
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("");
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // React Query hooks for data management
  const { data: simCards = [], isLoading, error, refetch } = useSimCards();
  const { data: stats } = useSimCardStats();
  const createSimCard = useCreateSimCard();
  const updateSimCard = useUpdateSimCard();
  const deleteSimCard = useDeleteSimCard();





  // Filtered data
  const filteredSimCards = simCards.filter(simCard => {
    const matchesSearch = simCard.sim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         simCard.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (simCard.current_user && simCard.current_user.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || simCard.status === statusFilter;
    const matchesDepartment = !departmentFilter || simCard.department === departmentFilter;
    const matchesPackageType = !packageTypeFilter || simCard.package_type === packageTypeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPackageType;
  });

  // Handlers
  const handleAddSimCard = () => {
    setEditingSimCard(null);
    setShowForm(true);
  };

  const handleEditSimCard = (simCard) => {
    setEditingSimCard(simCard);
    setShowForm(true);
  };

  const handleDeleteSimCard = (simCardId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this SIM card?");
    if (confirmDelete) {
      deleteSimCard.mutate(simCardId);
    }
  };

  const handleSubmitSimCard = (formData) => {
    const simCardData = {
      ...formData,
      user_id: user?.id,
      monthly_cost: parseFloat(formData.monthly_cost) || 0
    };

    console.log('📝 Submitting SIM card data:', simCardData);

    if (editingSimCard) {
      // Update existing SIM card
      updateSimCard.mutate({ id: editingSimCard.id, ...simCardData }, {
        onSuccess: () => {
          setShowForm(false);
          setEditingSimCard(null);
        },
        onError: (error) => {
          alert(`Failed to update SIM card: ${error.message}`);
        }
      });
    } else {
      // Add new SIM card
      createSimCard.mutate(simCardData, {
        onSuccess: () => {
          setShowForm(false);
          setEditingSimCard(null);
        },
        onError: (error) => {
          alert(`Failed to create SIM card: ${error.message}`);
        }
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSimCard(null);
  };

  // Role-based permission functions
  const canViewSimCard = useCallback(() => {
    const userRole = user?.user_metadata?.role || userProfile?.role;
    return userRole === 'admin' || userRole === 'hr_manager';
  }, [user?.user_metadata?.role, userProfile?.role]);

  const canEditSimCard = useCallback(() => {
    const userRole = user?.user_metadata?.role || userProfile?.role;
    return userRole === 'admin';
  }, [user?.user_metadata?.role, userProfile?.role]);

  const canDeleteSimCard = useCallback(() => {
    const userRole = user?.user_metadata?.role || userProfile?.role;
    return userRole === 'admin';
  }, [user?.user_metadata?.role, userProfile?.role]);

  const canAddSimCard = useCallback(() => {
    const userRole = user?.user_metadata?.role || userProfile?.role;
    return userRole === 'admin';
  }, [user?.user_metadata?.role, userProfile?.role]);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30'
    } flex`}>
      <div className="flex-1 transition-all duration-300 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className={`rounded-2xl p-8 shadow-xl border transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700/50' 
                : 'bg-white border-gray-200/50 bg-gradient-to-r from-white to-blue-50/50'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      SIM Card Management
                    </h1>
                    <p className={`mt-2 text-lg transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      Manage company SIM cards, packages, and user assignments with ease
                    </p>
                    <div className={`flex items-center gap-4 mt-4 text-sm transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Signal className="w-4 h-4 text-green-500" />
                        <span>Active Management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>Secure Control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <span>Real-time Analytics</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDepartmentManager(true)}
                    className={`px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl font-medium ${
                      isDark ? 'shadow-gray-500/25' : 'shadow-gray-500/20'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                    Manage Departments
                  </button>
                  {canAddSimCard() && (
                    <button
                      onClick={handleAddSimCard}
                      className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl font-medium ${
                        isDark ? 'shadow-blue-500/25' : 'shadow-blue-500/20'
                      }`}
                    >
                      <Plus className="w-5 h-5" />
                      Add SIM Card
                    </button>
                  )}
                </div>
              </div>
            </div>
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
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setDepartmentFilter("");
                  setPackageTypeFilter("");
                }}
                className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${
                  isDark 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative group">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  isDark ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search SIM cards..."
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
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={`p-6 rounded-xl shadow-sm mb-6 transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/80 border border-slate-700/50' 
                : 'bg-white border border-gray-200/50'
            }`}>
              <div className="flex items-center justify-center py-8">
                <Loader2 className={`w-6 h-6 animate-spin transition-colors duration-300 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`ml-2 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>Loading SIM cards...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={`p-6 rounded-xl shadow-sm mb-6 transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/80 border border-slate-700/50' 
                : 'bg-white border border-gray-200/50'
            }`}>
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-lg text-red-600 font-medium">Failed to load SIM cards</p>
                <p className={`text-sm mt-2 transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>{error.message}</p>
              </div>
            </div>
          )}

          {/* Enhanced Summary Cards */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-white/70" />
                  </div>
                  <p className="text-sm font-medium text-blue-100 mb-1">Total SIM Cards</p>
                  <p className="text-3xl font-bold text-white">
                    {stats?.total_sim_cards || simCards.length}
                  </p>
                  <p className="text-xs text-blue-100 mt-2">Across all departments</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Signal className="w-6 h-6 text-white" />
                    </div>
                    <Activity className="w-5 h-5 text-white/70" />
                  </div>
                  <p className="text-sm font-medium text-green-100 mb-1">Active SIM Cards</p>
                  <p className="text-3xl font-bold text-white">
                    {stats?.active_sim_cards || simCards.filter(s => s.status === 'Active').length}
                  </p>
                  <p className="text-xs text-green-100 mt-2">Currently operational</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <User className="w-5 h-5 text-white/70" />
                  </div>
                  <p className="text-sm font-medium text-amber-100 mb-1">Assigned SIM Cards</p>
                  <p className="text-3xl font-bold text-white">
                    {stats?.assigned_sim_cards || simCards.filter(s => s.current_user).length}
                  </p>
                  <p className="text-xs text-amber-100 mt-2">In use by employees</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <Zap className="w-5 h-5 text-white/70" />
                  </div>
                  <p className="text-sm font-medium text-purple-100 mb-1">Monthly Cost</p>
                  <p className="text-3xl font-bold text-white">
                    AED {(stats?.total_monthly_cost || simCards.reduce((total, sim) => total + (parseFloat(sim.monthly_cost) || 0), 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-100 mt-2">Total monthly expenses</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading SIM cards...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Please wait while we fetch your data</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading SIM Cards</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* Enhanced SIM Cards Grid */}
          {!isLoading && !error && (
            <div className={`p-8 rounded-2xl shadow-xl border transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/50' 
                : 'bg-white border-gray-200/50'
            }`}>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <Phone className={`w-5 h-5 transition-colors duration-300 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                      isDark ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                      SIM Cards ({filteredSimCards.length})
                    </h2>
                    <p className={`mt-1 transition-colors duration-300 ${
                      isDark ? 'text-slate-300' : 'text-gray-600'
                    }`}>
                      Manage and monitor all SIM card assets
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔍 Manual data fetch test...');
                        const { data, error } = await supabase
                          .from('sim_cards')
                          .select('*')
                          .limit(5);
                        
                        if (error) {
                          console.error('❌ Manual fetch failed:', error);
                          alert(`Manual fetch failed: ${error.message}`);
                        } else {
                          console.log('✅ Manual fetch successful:', data);
                          alert(`Manual fetch successful! Found ${data.length} SIM cards`);
                        }
                      } catch (err) {
                        console.error('❌ Manual fetch error:', err);
                        alert(`Manual fetch error: ${err.message}`);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isDark 
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Test Data Fetch
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔄 Refreshing SIM cards data...');
                        // Invalidate and refetch
                        await queryClient.invalidateQueries(['simCards']);
                        await refetch();
                        console.log('✅ Data refreshed successfully');
                      } catch (err) {
                        console.error('❌ Refresh error:', err);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isDark 
                        ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Refresh Data
                  </button>
                  <div className={`flex items-center gap-3 text-sm px-4 py-2 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'text-slate-400 bg-slate-700/50' 
                      : 'text-gray-500 bg-gray-100'
                  }`}>
                    <Filter className="w-4 h-4" />
                    <span>Showing {filteredSimCards.length} of {simCards.length} SIM cards</span>
                  </div>
                </div>
              </div>

              {filteredSimCards.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                    isDark ? 'bg-slate-700/50' : 'bg-gray-100'
                  }`}>
                    <Phone className={`w-12 h-12 transition-colors duration-300 ${
                      isDark ? 'text-slate-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    No SIM cards found
                  </h3>
                  <p className={`max-w-md mx-auto transition-colors duration-300 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    {searchTerm || statusFilter || departmentFilter || packageTypeFilter 
                      ? "Try adjusting your filters or search terms to find what you're looking for" 
                      : "Get started by adding your first SIM card to the system"}
                  </p>
                  {!searchTerm && !statusFilter && !departmentFilter && !packageTypeFilter && canAddSimCard() && (
                    <button
                      onClick={handleAddSimCard}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 mx-auto transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                      Add First SIM Card
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredSimCards.map((simCard, index) => (
                      <motion.div
                        key={simCard.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        layout
                      >
                        <SimCard
                          simCard={simCard}
                          onEdit={handleEditSimCard}
                          onDelete={handleDeleteSimCard}
                          isDark={isDark}
                          canEdit={canEditSimCard()}
                          canDelete={canDeleteSimCard()}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

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
      </div>
    </div>
  );
} 
