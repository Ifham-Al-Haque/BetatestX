import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash, Search, Filter, Phone, User, Building,
  Wifi, Signal, Calendar, Package, CreditCard, Download,
  X, Save, Users, MapPin, Clock, AlertCircle
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {simCard ? "Edit SIM Card" : "Add New SIM Card"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SIM Number *
              </label>
              <input
                type="text"
                name="sim_number"
                value={formData.sim_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter SIM number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Name *
              </label>
              <input
                type="text"
                name="package_name"
                value={formData.package_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter package name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Type
              </label>
              <select
                name="package_type"
                value={formData.package_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Default">Default</option>
                <option value="Custom">Custom Made</option>
                <option value="Corporate">Corporate</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Cost (AED)
              </label>
              <input
                type="number"
                name="monthly_cost"
                value={formData.monthly_cost}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter monthly cost"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Limit
              </label>
              <input
                type="text"
                name="data_limit"
                value={formData.data_limit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 10GB, Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Minutes
              </label>
              <input
                type="text"
                name="voice_minutes"
                value={formData.voice_minutes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1000 minutes, Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SMS Limit
              </label>
              <input
                type="text"
                name="sms_limit"
                value={formData.sms_limit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 100 SMS, Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current User
              </label>
              <input
                type="text"
                name="current_user"
                value={formData.current_user}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter current user name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Previous User
              </label>
              <input
                type="text"
                name="previous_user"
                value={formData.previous_user}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter previous user name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
                <option value="Management">Management</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activation Date
              </label>
              <input
                type="date"
                name="activation_date"
                value={formData.activation_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Package Benefits
            </label>
            <textarea
              name="package_benefits"
              value={formData.package_benefits}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Describe package benefits..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
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

// SIM Card Component
const SimCard = ({ simCard, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPackageTypeColor = (type) => {
    switch (type) {
      case 'Custom': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Corporate': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'Premium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {simCard.sim_number}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {simCard.package_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(simCard)}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(simCard.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(simCard.status)}`}>
            {simCard.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Package Type</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPackageTypeColor(simCard.package_type)}`}>
            {simCard.package_type}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Cost</span>
          <span className="text-sm text-gray-900 dark:text-white font-semibold">
            AED {simCard.monthly_cost}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Current User</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {simCard.current_user || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Department</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {simCard.department || 'Not specified'}
          </span>
        </div>

        {simCard.data_limit && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Data Limit</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {simCard.data_limit}
            </span>
          </div>
        )}

        {simCard.voice_minutes && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Voice Minutes</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {simCard.voice_minutes}
            </span>
          </div>
        )}

        {simCard.notes && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {simCard.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function Simcard() {
  const { sidebarWidth } = useSidebar();
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("");
  
  // Sample data - replace with actual API calls
  const [simCards, setSimCards] = useState([
    {
      id: 1,
      sim_number: "+971501234567",
      package_name: "Corporate Unlimited",
      package_type: "Corporate",
      package_benefits: "Unlimited data, voice, and SMS for corporate use",
      monthly_cost: "299",
      data_limit: "Unlimited",
      voice_minutes: "Unlimited",
      sms_limit: "Unlimited",
      current_user: "Ahmed Al Mansouri",
      previous_user: "Sarah Johnson",
      department: "IT",
      status: "Active",
      activation_date: "2024-01-15",
      expiry_date: "2025-01-15",
      notes: "Primary corporate line for IT department"
    },
    {
      id: 2,
      sim_number: "+971502345678",
      package_name: "Basic Plan",
      package_type: "Default",
      package_benefits: "5GB data, 500 minutes, 100 SMS",
      monthly_cost: "99",
      data_limit: "5GB",
      voice_minutes: "500 minutes",
      sms_limit: "100 SMS",
      current_user: "Fatima Hassan",
      previous_user: "",
      department: "Sales",
      status: "Active",
      activation_date: "2024-03-01",
      expiry_date: "2025-03-01",
      notes: "Sales team member line"
    },
    {
      id: 3,
      sim_number: "+971503456789",
      package_name: "Premium Business",
      package_type: "Premium",
      package_benefits: "20GB data, unlimited voice, 500 SMS",
      monthly_cost: "199",
      data_limit: "20GB",
      voice_minutes: "Unlimited",
      sms_limit: "500 SMS",
      current_user: "",
      previous_user: "Mohammed Ali",
      department: "Marketing",
      status: "Inactive",
      activation_date: "2023-06-01",
      expiry_date: "2024-06-01",
      notes: "Currently unassigned, available for new user"
    }
  ]);

  // Filtered data
  const filteredSimCards = simCards.filter(simCard => {
    const matchesSearch = simCard.sim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         simCard.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         simCard.current_user.toLowerCase().includes(searchTerm.toLowerCase());
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
      setSimCards(simCards.filter(simCard => simCard.id !== simCardId));
    }
  };

  const handleSubmitSimCard = (formData) => {
    if (editingSimCard) {
      // Update existing SIM card
      setSimCards(simCards.map(simCard => 
        simCard.id === editingSimCard.id 
          ? { ...simCard, ...formData }
          : simCard
      ));
    } else {
      // Add new SIM card
      const newSimCard = {
        id: Date.now(),
        ...formData
      };
      setSimCards([...simCards, newSimCard]);
    }
    setShowForm(false);
    setEditingSimCard(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSimCard(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                SIM Card Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage company SIM cards, packages, and user assignments
              </p>
            </div>
            <button
              onClick={handleAddSimCard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add SIM Card
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search SIM cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Departments</option>
                <option value="IT">IT</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
                <option value="Management">Management</option>
              </select>

              <select
                value={packageTypeFilter}
                onChange={(e) => setPackageTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Package Types</option>
                <option value="Default">Default</option>
                <option value="Custom">Custom Made</option>
                <option value="Corporate">Corporate</option>
                <option value="Premium">Premium</option>
                <option value="Basic">Basic</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setDepartmentFilter("");
                  setPackageTypeFilter("");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total SIM Cards</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{simCards.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Signal className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active SIM Cards</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {simCards.filter(s => s.status === 'Active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned SIM Cards</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {simCards.filter(s => s.current_user).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Cost</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    AED {simCards.reduce((total, sim) => total + (parseFloat(sim.monthly_cost) || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SIM Cards Grid */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                SIM Cards ({filteredSimCards.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Filter className="w-4 h-4" />
                Showing {filteredSimCards.length} of {simCards.length} SIM cards
              </div>
            </div>

            {filteredSimCards.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500 font-medium">No SIM cards found</p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm || statusFilter || departmentFilter || packageTypeFilter 
                    ? "Try adjusting your filters" 
                    : "Add your first SIM card to get started"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredSimCards.map((simCard) => (
                    <SimCard
                      key={simCard.id}
                      simCard={simCard}
                      onEdit={handleEditSimCard}
                      onDelete={handleDeleteSimCard}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* SIM Card Form Modal */}
          <AnimatePresence>
            {showForm && (
              <SimCardForm
                simCard={editingSimCard}
                onClose={handleCloseForm}
                onSubmit={handleSubmitSimCard}
                isLoading={false}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 
