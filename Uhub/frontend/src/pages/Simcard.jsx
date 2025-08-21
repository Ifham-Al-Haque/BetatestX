import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash, Search, Filter, Phone, User, Building,
  Wifi, Signal, Calendar, Package, CreditCard, Download,
  X, Save, Users, MapPin, Clock, AlertCircle, Loader2,
  BarChart3, TrendingUp, Activity, Zap, Shield
} from "lucide-react";
import { useSimCards, useCreateSimCard, useUpdateSimCard, useDeleteSimCard, useSimCardStats } from "../hooks/useSimCards";
import { useAuth } from "../context/AuthContext";
import { DEPARTMENTS, getDepartmentLabel, getDepartmentColor } from "../config/departments";
import DepartmentManager from "../components/DepartmentManager";

// SIM Card Form Component
const SimCardForm = ({ simCard, onClose, onSubmit, isLoading }) => {
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-200/20 dark:border-gray-700/50"
      >
        <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {simCard ? "Edit SIM Card" : "Add New SIM Card"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {simCard ? "Update SIM card information" : "Create a new SIM card for your organization"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  SIM Number *
                </label>
                <input
                  type="text"
                  name="sim_number"
                  value={formData.sim_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="Enter SIM number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Package Name *
                </label>
                <input
                  type="text"
                  name="package_name"
                  value={formData.package_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="Enter package name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Package Type
                </label>
                <select
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="Default">Default</option>
                  <option value="Custom">Custom Made</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Premium">Premium</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Monthly Cost (AED)
                </label>
                <input
                  type="number"
                  name="monthly_cost"
                  value={formData.monthly_cost}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Data Limit
                </label>
                <input
                  type="text"
                  name="data_limit"
                  value={formData.data_limit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="e.g., 10GB"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Voice Minutes
                </label>
                <input
                  type="text"
                  name="voice_minutes"
                  value={formData.voice_minutes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Current User
                </label>
                <input
                  type="text"
                  name="current_user"
                  value={formData.current_user}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="Enter current user name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Previous User
                </label>
                <input
                  type="text"
                  name="previous_user"
                  value={formData.previous_user}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                  placeholder="Enter previous user name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Activation Date
                </label>
                <input
                  type="date"
                  name="activation_date"
                  value={formData.activation_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Package Benefits
            </label>
            <textarea
              name="package_benefits"
              value={formData.package_benefits}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              placeholder="Describe package benefits..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
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
const SimCard = ({ simCard, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'Inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'Expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  const getPackageTypeColor = (type) => {
    switch (type) {
      case 'Custom': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700';
      case 'Corporate': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700';
      case 'Premium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 group cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {simCard.sim_number}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {simCard.package_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onEdit(simCard)}
            className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(simCard.id)}
            className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
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
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Cost</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            AED {simCard.monthly_cost}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current User</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white max-w-32 truncate">
            {simCard.current_user || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full bg-${getDepartmentColor(simCard.department)}-100 dark:bg-${getDepartmentColor(simCard.department)}-900 text-${getDepartmentColor(simCard.department)}-800 dark:text-${getDepartmentColor(simCard.department)}-200`}>
            {simCard.department ? getDepartmentLabel(simCard.department) : 'Not specified'}
          </span>
        </div>
      </div>

      {/* Additional Details */}
      {(simCard.data_limit || simCard.voice_minutes) && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            {simCard.data_limit && (
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Data</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{simCard.data_limit}</p>
              </div>
            )}
            {simCard.voice_minutes && (
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Phone className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Voice</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{simCard.voice_minutes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {simCard.notes && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{simCard.notes}"
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Activated: {simCard.activation_date}</span>
          <span>Expires: {simCard.expiry_date}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default function Simcard() {
  const { user } = useAuth();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("");
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  
  // React Query hooks for data management
  const { data: simCards = [], isLoading, error } = useSimCards();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <div className="flex-1 transition-all duration-300 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-700/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      SIM Card Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                      Manage company SIM cards, packages, and user assignments with ease
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
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
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Building className="w-5 h-5" />
                    Manage Departments
                  </button>
                  <button
                    onClick={handleAddSimCard}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add SIM Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter & Search</h3>
              </div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setDepartmentFilter("");
                  setPackageTypeFilter("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search SIM cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
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
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
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
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading SIM cards...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p className="text-lg text-red-600 font-medium">Failed to load SIM cards</p>
                <p className="text-sm text-gray-500 mt-2">{error.message}</p>
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
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      SIM Cards ({filteredSimCards.length})
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Manage and monitor all SIM card assets
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-xl">
                  <Filter className="w-4 h-4" />
                  <span>Showing {filteredSimCards.length} of {simCards.length} SIM cards</span>
                </div>
              </div>

              {filteredSimCards.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No SIM cards found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                    {searchTerm || statusFilter || departmentFilter || packageTypeFilter 
                      ? "Try adjusting your filters or search terms to find what you're looking for" 
                      : "Get started by adding your first SIM card to the system"}
                  </p>
                  {!searchTerm && !statusFilter && !departmentFilter && !packageTypeFilter && (
                    <button
                      onClick={handleAddSimCard}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
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
