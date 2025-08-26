// src/pages/ExpenseTracker.jsx
import { useState, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "../hooks/useApi";
import { useToast } from "../context/ToastContext";

import { motion } from "framer-motion";
import { Plus, Edit, Trash, Save, X, Filter, Search, Calendar, DollarSign, Building } from "lucide-react";

export default function ExpenseTracker() {
  const { user } = useAuth();
  
  const { success, error: showError } = useToast();
  
  // Form state
  const [form, setForm] = useState({
    service_name: "",
    amount_aed: "",
    currency: "AED",
    months: "",
    service_status: "active",
    department: "",
    date_paid: "",
    invoice_number: "",
    invoice_generation_date: "",
    invoice_due_date: "",
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    service_status: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Use React Query hooks
  const { data: expensesResponse, isLoading, error } = useExpenses(1, 1000, { userId: user?.id });
  const expenses = expensesResponse?.data || [];
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          expense.service_name?.toLowerCase().includes(searchTerm) ||
          expense.department?.toLowerCase().includes(searchTerm) ||
          expense.invoice_number?.toLowerCase().includes(searchTerm) ||
          expense.months?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Department filter
      if (filters.department && expense.department !== filters.department) {
        return false;
      }

      // Status filter
      if (filters.service_status && expense.service_status !== filters.service_status) {
        return false;
      }

      // Date range filter
      if (filters.startDate && new Date(expense.date_paid) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(expense.date_paid) > new Date(filters.endDate)) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount && parseFloat(expense.amount_aed) < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && parseFloat(expense.amount_aed) > parseFloat(filters.maxAmount)) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  // Get unique departments and statuses for filter dropdowns
  const uniqueDepartments = useMemo(() => {
    const departments = [...new Set(expenses.map(expense => expense.department).filter(Boolean))];
    return departments.sort();
  }, [expenses]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(expenses.map(expense => expense.service_status).filter(Boolean))];
    return statuses.sort();
  }, [expenses]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!user) {
      showError("Error", "User not logged in");
      return;
    }

    try {
      const newExpense = { ...form, user_id: user.id };
      await createExpenseMutation.mutateAsync(newExpense);
      
      setForm({
        service_name: "",
        amount_aed: "",
        currency: "AED",
        months: "",
        service_status: "active",
        department: "",
        date_paid: "",
        invoice_number: "",
        invoice_generation_date: "",
        invoice_due_date: "",
      });
      
      success("Success", "Expense added successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [form, user, createExpenseMutation, success, showError]);

  const startEdit = useCallback((expense) => {
    setEditingId(expense.id);
    setEditForm({ ...expense });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({});
  }, []);

  const saveEdit = useCallback(async () => {
    if (!user) {
      showError("Error", "User not logged in");
      return;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        id: editingId,
        data: {
          service_name: editForm.service_name,
          amount_aed: editForm.amount_aed,
          currency: editForm.currency,
          months: editForm.months,
          service_status: editForm.service_status,
          department: editForm.department,
          date_paid: editForm.date_paid,
          invoice_number: editForm.invoice_number,
          invoice_generation_date: editForm.invoice_generation_date,
          invoice_due_date: editForm.invoice_due_date,
        }
      });
      
      cancelEdit();
      success("Success", "Expense updated successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [editingId, editForm, user, updateExpenseMutation, cancelEdit, success, showError]);

  const handleDelete = useCallback(async (id) => {
    if (!user) {
      showError("Error", "User not logged in");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpenseMutation.mutateAsync(id);
      success("Success", "Expense deleted successfully!");
    } catch (err) {
      showError("Error", err.message);
    }
  }, [user, deleteExpenseMutation, success, showError]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      department: "",
      service_status: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        
        <div className="flex-1 transition-all duration-300 ease-in-out" >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error Loading Expenses</h3>
              <p className="text-red-600 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      
      <div className="flex-1 transition-all duration-300 ease-in-out" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Expense Tracker
            </h2>
          </div>

          {/* Add Expense Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add New Expense
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Service Name"
                value={form.service_name}
                onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Amount (AED)"
                value={form.amount_aed}
                onChange={(e) => setForm({ ...form, amount_aed: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Invoice Number"
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <input
                type="text"
                placeholder="Months"
                value={form.months}
                onChange={(e) => setForm({ ...form, months: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={form.service_status}
                onChange={(e) => setForm({ ...form, service_status: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="final">Final</option>
              </select>
              <input
                type="text"
                placeholder="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                value={form.date_paid}
                onChange={(e) => setForm({ ...form, date_paid: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                placeholder="Invoice Generation Date"
                value={form.invoice_generation_date}
                onChange={(e) => setForm({ ...form, invoice_generation_date: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                placeholder="Invoice Due Date"
                value={form.invoice_due_date}
                onChange={(e) => setForm({ ...form, invoice_due_date: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={createExpenseMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 col-span-full lg:col-span-1"
              >
                <Plus className="w-4 h-4" />
                {createExpenseMutation.isLoading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by service name, department, invoice number, or months..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={filters.service_status}
                  onChange={(e) => setFilters({ ...filters, service_status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <input
                  type="date"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                <input
                  type="date"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                <input
                  type="number"
                  placeholder="Min Amount (AED)"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                <input
                  type="number"
                  placeholder="Max Amount (AED)"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </div>
          </motion.div>

          {/* Expenses List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Expenses
              </h3>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading expenses...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Gen. Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredExpenses.map((expense) => (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingId === expense.id ? (
                            <input
                              type="text"
                              value={editForm.service_name}
                              onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            expense.service_name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingId === expense.id ? (
                            <input
                              type="text"
                              value={editForm.invoice_number || ""}
                              onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                              {expense.invoice_number || "N/A"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingId === expense.id ? (
                            <input
                              type="date"
                              value={editForm.invoice_generation_date || ""}
                              onChange={(e) => setEditForm({ ...editForm, invoice_generation_date: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            expense.invoice_generation_date ? new Date(expense.invoice_generation_date).toLocaleDateString() : "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingId === expense.id ? (
                            <input
                              type="date"
                              value={editForm.invoice_due_date || ""}
                              onChange={(e) => setEditForm({ ...editForm, invoice_due_date: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            expense.invoice_due_date ? new Date(expense.invoice_due_date).toLocaleDateString() : "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingId === expense.id ? (
                            <input
                              type="number"
                              value={editForm.amount_aed}
                              onChange={(e) => setEditForm({ ...editForm, amount_aed: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            `AED ${parseFloat(expense.amount_aed).toFixed(2)}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {editingId === expense.id ? (
                            <input
                              type="date"
                              value={editForm.date_paid}
                              onChange={(e) => setEditForm({ ...editForm, date_paid: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            new Date(expense.date_paid).toLocaleDateString()
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {expense.department || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            expense.service_status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : expense.service_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : expense.service_status === 'final'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {expense.service_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingId === expense.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={saveEdit}
                                disabled={updateExpenseMutation.isLoading}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(expense)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                disabled={deleteExpenseMutation.isLoading}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredExpenses.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {expenses.length === 0 
                        ? "No expenses found. Add your first expense above."
                        : "No expenses match your current filters. Try adjusting your search criteria."
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


