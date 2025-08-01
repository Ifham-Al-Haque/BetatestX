// src/pages/ExpenseTracker.jsx
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "../hooks/useApi";
import { useToast } from "../components/Toast";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { Plus, Edit, Trash, Save, X } from "lucide-react";

export default function ExpenseTracker() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [form, setForm] = useState({
    service_name: "",
    amount_aed: "",
    currency: "AED",
    months: "",
    service_status: "active",
    department: "",
    date_paid: "",
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Use React Query hooks
  const { data: expenses = [], isLoading, error } = useExpenses(1, 1000, { userId: user?.id });
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

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

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="ml-64 p-6 w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Expenses</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <button
              type="submit"
              disabled={createExpenseMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {createExpenseMutation.isLoading ? "Adding..." : "Add Expense"}
            </button>
          </form>
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
                  {expenses.map((expense) => (
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
              
              {expenses.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No expenses found. Add your first expense above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


