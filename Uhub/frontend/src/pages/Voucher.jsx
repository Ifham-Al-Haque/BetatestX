import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash, Search, Filter, FileText, Download, Calendar,
  DollarSign, User, Building, Tag, CreditCard, Receipt, Clock,
  X, Save, Eye, Printer, Share2, AlertCircle, CheckCircle
} from "lucide-react";



// Voucher Form Component
const VoucherForm = ({ voucher, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    voucher_number: voucher?.voucher_number || "",
    voucher_type: voucher?.voucher_type || "Expense",
    amount: voucher?.amount || "",
    currency: voucher?.currency || "AED",
    description: voucher?.description || "",
    category: voucher?.category || "",
    department: voucher?.department || "",
    employee_name: voucher?.employee_name || "",
    vendor_name: voucher?.vendor_name || "",
    issue_date: voucher?.issue_date || "",
    status: voucher?.status || "Pending",
    approval_status: voucher?.approval_status || "Pending",
    notes: voucher?.notes || ""
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
              {voucher ? "Edit Voucher" : "Create New Voucher"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voucher Number *
              </label>
              <input
                type="text"
                name="voucher_number"
                value={formData.voucher_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter voucher number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voucher Type *
              </label>
              <select
                name="voucher_type"
                value={formData.voucher_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Expense">Expense</option>
                <option value="Payment">Payment</option>
                <option value="Reimbursement">Reimbursement</option>
                <option value="Advance">Advance</option>
                <option value="Refund">Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Category</option>
                <option value="Travel">Travel</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Software">Software</option>
                <option value="Services">Services</option>
                <option value="Marketing">Marketing</option>
                <option value="Training">Training</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
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
                Employee Name
              </label>
              <input
                type="text"
                name="employee_name"
                value={formData.employee_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter employee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Approval Status
              </label>
              <select
                name="approval_status"
                value={formData.approval_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter voucher description..."
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
              {isLoading ? "Saving..." : (voucher ? "Update Voucher" : "Create Voucher")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Voucher Component
const VoucherCard = ({ voucher, onEdit, onDelete, onDownload }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'Draft': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getVoucherTypeIcon = (type) => {
    switch (type) {
      case 'Expense': return <Receipt className="w-5 h-5" />;
      case 'Payment': return <CreditCard className="w-5 h-5" />;
      case 'Reimbursement': return <FileText className="w-5 h-5" />;
      case 'Advance': return <DollarSign className="w-5 h-5" />;
      case 'Refund': return <CheckCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
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
            {getVoucherTypeIcon(voucher.voucher_type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {voucher.voucher_number}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {voucher.voucher_type} • {voucher.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownload(voucher)}
            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(voucher)}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(voucher.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            title="Delete"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {voucher.currency} {parseFloat(voucher.amount).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(voucher.status)}`}>
            {voucher.status}
          </span>
        </div>

        {voucher.employee_name && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Employee</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {voucher.employee_name}
            </span>
          </div>
        )}

        {voucher.department && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Department</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {voucher.department}
            </span>
          </div>
        )}

        {voucher.issue_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Issue Date</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {new Date(voucher.issue_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {voucher.description && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {voucher.description}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function Voucher() {
  
  
  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  
  // Sample data
  const [vouchers, setVouchers] = useState([
    {
      id: 1,
      voucher_number: "VCH-2024-001",
      voucher_type: "Expense",
      amount: "1250.00",
      currency: "AED",
      description: "Office supplies and stationery for IT department",
      category: "Office Supplies",
      department: "IT",
      employee_name: "Ahmed Al Mansouri",
      vendor_name: "Office Plus UAE",
      issue_date: "2024-01-15",
      status: "Paid",
      approval_status: "Approved",
      notes: "Urgent supplies needed for new project"
    },
    {
      id: 2,
      voucher_number: "VCH-2024-002",
      voucher_type: "Reimbursement",
      amount: "850.00",
      currency: "AED",
      description: "Travel expenses for client meeting in Dubai",
      category: "Travel",
      department: "Sales",
      employee_name: "Fatima Hassan",
      vendor_name: "",
      issue_date: "2024-01-20",
      status: "Pending",
      approval_status: "Under Review",
      notes: "Includes taxi, lunch, and parking fees"
    },
    {
      id: 3,
      voucher_number: "VCH-2024-003",
      voucher_type: "Payment",
      amount: "5000.00",
      currency: "AED",
      description: "Software license renewal for design tools",
      category: "Software",
      department: "Marketing",
      employee_name: "",
      vendor_name: "Adobe Systems",
      issue_date: "2024-01-25",
      status: "Approved",
      approval_status: "Approved",
      notes: "Annual subscription renewal"
    }
  ]);

  // Filtered data
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || voucher.status === statusFilter;
    const matchesType = !typeFilter || voucher.voucher_type === typeFilter;
    const matchesCategory = !categoryFilter || voucher.category === categoryFilter;
    const matchesDepartment = !departmentFilter || voucher.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesDepartment;
  });

  // Handlers
  const handleAddVoucher = () => {
    setEditingVoucher(null);
    setShowForm(true);
  };

  const handleEditVoucher = (voucher) => {
    setEditingVoucher(voucher);
    setShowForm(true);
  };

  const handleDeleteVoucher = (voucherId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this voucher?");
    if (confirmDelete) {
      setVouchers(vouchers.filter(voucher => voucher.id !== voucherId));
    }
  };

  const handleDownloadVoucher = (voucher) => {
    // Generate PDF content
    const pdfContent = `
      VOUCHER DOCUMENT
      
      Voucher Number: ${voucher.voucher_number}
      Type: ${voucher.voucher_type}
      Amount: ${voucher.currency} ${voucher.amount}
      Description: ${voucher.description}
      Category: ${voucher.category}
      Department: ${voucher.department}
      Employee: ${voucher.employee_name || 'N/A'}
      Vendor: ${voucher.vendor_name || 'N/A'}
      Issue Date: ${voucher.issue_date}
      Status: ${voucher.status}
      Approval Status: ${voucher.approval_status}
      Notes: ${voucher.notes || 'N/A'}
    `;
    
    // Create and download PDF (simplified version)
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${voucher.voucher_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSubmitVoucher = (formData) => {
    if (editingVoucher) {
      setVouchers(vouchers.map(voucher => 
        voucher.id === editingVoucher.id 
          ? { ...voucher, ...formData }
          : voucher
      ));
    } else {
      const newVoucher = {
        id: Date.now(),
        ...formData
      };
      setVouchers([...vouchers, newVoucher]);
    }
    setShowForm(false);
    setEditingVoucher(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVoucher(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      
      <div className="flex-1 transition-all duration-300 ease-in-out" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Voucher Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage company vouchers, track payments, and generate reports
              </p>
            </div>
            <button
              onClick={handleAddVoucher}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Voucher
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search vouchers..."
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="Expense">Expense</option>
                <option value="Payment">Payment</option>
                <option value="Reimbursement">Reimbursement</option>
                <option value="Advance">Advance</option>
                <option value="Refund">Refund</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="Travel">Travel</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Software">Software</option>
                <option value="Services">Services</option>
                <option value="Marketing">Marketing</option>
                <option value="Training">Training</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
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
                <option value="Other">Other</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setTypeFilter("");
                  setCategoryFilter("");
                  setDepartmentFilter("");
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
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vouchers</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{vouchers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {vouchers.filter(v => v.approval_status === 'Approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {vouchers.filter(v => v.status === 'Pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    AED {vouchers.reduce((total, v) => total + (parseFloat(v.amount) || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vouchers Grid */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Vouchers ({filteredVouchers.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Filter className="w-4 h-4" />
                Showing {filteredVouchers.length} of {vouchers.length} vouchers
              </div>
            </div>

            {filteredVouchers.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500 font-medium">No vouchers found</p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm || statusFilter || typeFilter || categoryFilter || departmentFilter 
                    ? "Try adjusting your filters" 
                    : "Create your first voucher to get started"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredVouchers.map((voucher) => (
                    <VoucherCard
                      key={voucher.id}
                      voucher={voucher}
                      onEdit={handleEditVoucher}
                      onDelete={handleDeleteVoucher}
                      onDownload={handleDownloadVoucher}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Voucher Form Modal */}
          <AnimatePresence>
            {showForm && (
              <VoucherForm
                voucher={editingVoucher}
                onClose={handleCloseForm}
                onSubmit={handleSubmitVoucher}
                isLoading={false}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
