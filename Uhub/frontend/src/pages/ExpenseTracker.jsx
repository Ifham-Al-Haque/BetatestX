// src/pages/ExpenseTracker.jsx
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAllExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { DEPARTMENTS } from '../config/departments';
import { parseExpenseFile, mapRowToExpense, getExpenseImportTemplateCsv } from '../utils/expenseImportUtils';
import {
  applyPeriodFilter,
  filterExpenses,
  sortExpenses,
  computeExpenseStats,
  exportExpensesCsv,
  getDefaultExpenseForm,
  EMPTY_FILTERS,
  PERIOD_OPTIONS,
  STATUS_OPTIONS,
  getExpenseAmount,
} from '../utils/expenseHelpers';
import { getBillingPeriodMonthKey } from '../utils/analyticsHelpers';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Filter,
  Search,
  Upload,
  Download,
  AlertTriangle,
  BarChart3,
  List,
  FileSpreadsheet,
  ExternalLink,
  Calendar,
} from 'lucide-react';

import ExpenseStatsCards from '../components/expense/ExpenseStatsCards';
import ExpenseFormPanel from '../components/expense/ExpenseFormPanel';
import ExpenseImportPanel from '../components/expense/ExpenseImportPanel';
import ExpenseTable from '../components/expense/ExpenseTable';
import { uploadExpenseReceipt, validateExpenseReceiptFile } from '../services/expenseAttachmentService';

const TABS = [
  { id: 'expenses', label: 'Expenses', icon: List },
  { id: 'add', label: 'Add Expense', icon: Plus },
  { id: 'import', label: 'Import', icon: FileSpreadsheet },
];

export default function ExpenseTracker() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('expenses');
  const [period, setPeriod] = useState('all');
  const [form, setForm] = useState(getDefaultExpenseForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [sortField, setSortField] = useState('date_paid');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const fileInputRef = useRef(null);

  const { data: expenses = [], isLoading, error } = useAllExpenses({ userId: user?.id });
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const periodFiltered = useMemo(
    () => applyPeriodFilter(expenses, period),
    [expenses, period]
  );

  const fixBillingPeriod = searchParams.get('fixBillingPeriod') === '1';

  const scopeExpenses = useMemo(() => {
    if (!fixBillingPeriod) return periodFiltered;
    return periodFiltered.filter((expense) => {
      const amount = getExpenseAmount(expense);
      if (!amount || amount <= 0) return false;
      return !getBillingPeriodMonthKey(expense);
    });
  }, [periodFiltered, fixBillingPeriod]);

  const filteredExpenses = useMemo(
    () => filterExpenses(scopeExpenses, filters),
    [scopeExpenses, filters]
  );

  const sortedExpenses = useMemo(
    () => sortExpenses(filteredExpenses, sortField, sortDirection),
    [filteredExpenses, sortField, sortDirection]
  );

  const stats = useMemo(() => computeExpenseStats(filteredExpenses), [filteredExpenses]);

  const validImportCount = useMemo(
    () => importPreview.filter((p) => p.rowErrors.length === 0).length,
    [importPreview]
  );
  const invalidImportCount = importPreview.length - validImportCount;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, period, sortField, sortDirection, pageSize]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (!q) return;
    setFilters((prev) => ({ ...prev, search: q }));
    setShowFilters(true);
    setActiveTab('expenses');
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('fixBillingPeriod') !== '1') return;
    setActiveTab('expenses');
    setPeriod('all');
    setShowFilters(false);
  }, [searchParams]);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptError('');
      return;
    }
    setReceiptError(validateExpenseReceiptFile(receiptFile) || '');
  }, [receiptFile]);

  const handleSort = useCallback((field) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!user) {
      showError('Error', 'User not logged in');
      return;
    }
    if (receiptFile) {
      const fileError = validateExpenseReceiptFile(receiptFile);
      if (fileError) {
        setReceiptError(fileError);
        showError('Receipt', fileError);
        return;
      }
    }

    try {
      let receiptMeta = {};
      if (receiptFile) {
        receiptMeta = await uploadExpenseReceipt(user.id, receiptFile);
      }

      const payload = {
        ...form,
        notes: form.notes?.trim() || null,
        ...receiptMeta,
        user_id: user.id,
      };

      await createExpenseMutation.mutateAsync(payload);
      setForm(getDefaultExpenseForm());
      setReceiptFile(null);
      setReceiptError('');
      success('Success', 'Expense added successfully!');
      setActiveTab('expenses');
    } catch (err) {
      showError('Error', err.message);
    }
  }, [form, user, receiptFile, createExpenseMutation, success, showError]);

  const handleClearForm = useCallback(() => {
    setForm(getDefaultExpenseForm());
    setReceiptFile(null);
    setReceiptError('');
  }, []);

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
      showError('Error', 'User not logged in');
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
          notes: editForm.notes?.trim() || null,
        },
      });
      cancelEdit();
      success('Success', 'Expense updated successfully!');
    } catch (err) {
      showError('Error', err.message);
    }
  }, [editingId, editForm, user, updateExpenseMutation, cancelEdit, success, showError]);

  const handleDelete = useCallback((id) => {
    if (!user) {
      showError('Error', 'User not logged in');
      return;
    }
    setDeleteConfirmId(id);
  }, [user, showError]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteExpenseMutation.mutateAsync(deleteConfirmId);
      success('Success', 'Expense deleted successfully!');
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteExpenseMutation, success, showError]);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPeriod('all');
  }, []);

  const handleExport = useCallback(() => {
    if (!sortedExpenses.length) {
      showError('Export', 'No expenses to export for the current filters.');
      return;
    }
    exportExpensesCsv(sortedExpenses);
    success('Export', `Exported ${sortedExpenses.length} expense(s).`);
  }, [sortedExpenses, showError, success]);

  const handleImportFileChange = useCallback(async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setImportError('');
    setImportPreview([]);

    const name = (file.name || '').toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setImportError('Please select a CSV or Excel (.xlsx, .xls) file.');
      return;
    }

    try {
      const { rows, errors } = await parseExpenseFile(file);
      if (errors.length) {
        setImportError(errors.join(' '));
        return;
      }
      if (!rows.length) {
        setImportError('No data rows found in the file.');
        return;
      }
      setImportPreview(rows.map((row) => mapRowToExpense(row)));
    } catch (err) {
      setImportError(err?.message || 'Failed to parse file.');
    }
    e.target.value = '';
  }, []);

  const handleImportConfirm = useCallback(async () => {
    if (!user) {
      showError('Error', 'User not logged in');
      return;
    }
    const toImport = importPreview
      .filter((p) => p.rowErrors.length === 0)
      .map((p) => ({ ...p.expense, user_id: user.id }));

    if (!toImport.length) {
      showError('Import', 'No valid rows to import. Fix errors and try again.');
      return;
    }

    setImporting(true);
    let imported = 0;
    const failed = [];

    for (let i = 0; i < toImport.length; i++) {
      try {
        await createExpenseMutation.mutateAsync(toImport[i]);
        imported++;
      } catch (err) {
        failed.push({ row: i + 1, message: err?.message || 'Failed' });
      }
    }

    setImporting(false);
    setImportPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (imported > 0) {
      success('Import complete', `Imported ${imported} expense(s).`);
      setActiveTab('expenses');
    }
    if (failed.length > 0) {
      showError(
        'Import partial',
        `${failed.length} row(s) failed: ${failed.slice(0, 3).map((f) => `Row ${f.row}: ${f.message}`).join('; ')}${failed.length > 3 ? '…' : ''}`
      );
    }
  }, [user, importPreview, createExpenseMutation, success, showError]);

  const handleImportCancel = useCallback(() => {
    setImportPreview([]);
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const downloadTemplate = useCallback(() => {
    const csv = getExpenseImportTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'All Time';

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <h3 className="text-red-800 dark:text-red-200 font-semibold">Error Loading Expenses</h3>
            <p className="text-red-600 dark:text-red-300 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Finance</p>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Expense Tracker</h1>
              <p className="text-emerald-50/90 text-base max-w-xl">
                Manage invoices, track spending by department, and import bulk records — {periodLabel.toLowerCase()} view.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <Link
                to="/analytics"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-medium transition-colors shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Link>
            </div>
          </div>

          {/* Period selector in hero */}
          <div className="mt-6 flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {fixBillingPeriod && (
          <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Showing {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'} missing a valid billing period
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                Edit each record and set billing period (e.g. Jan 2026) to include it in the monthly trend chart.
              </p>
            </div>
            <Link
              to="/expenses"
              className="text-xs font-medium text-amber-800 dark:text-amber-200 hover:underline shrink-0"
            >
              Show all expenses
            </Link>
          </div>
        )}

        {/* Stats — visible on all tabs */}
        <div className="mb-6">
          <ExpenseStatsCards stats={stats} totalCount={stats.totalCount} />
        </div>

        {/* Tab navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 p-2 mb-6">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Filters toolbar */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Search & filters
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    {showFilters ? 'Hide advanced filters' : 'Show advanced filters'}
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search service, department, invoice #, months…"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All departments</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                      ))}
                    </select>

                    <select
                      value={filters.service_status}
                      onChange={(e) => setFilters({ ...filters, service_status: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All statuses</option>
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                        aria-label="Start date"
                      />
                      <span className="text-gray-400">–</span>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                        aria-label="End date"
                      />
                    </div>

                    <input
                      type="number"
                      placeholder="Min amount"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max amount"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                      className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium"
                    >
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </div>

              <ExpenseTable
                expenses={sortedExpenses}
                totalFiltered={filteredExpenses.length}
                totalAll={expenses.length}
                isLoading={isLoading}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={handleDelete}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                onClearFilters={clearFilters}
              />
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ExpenseFormPanel
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onClear={handleClearForm}
                onGoToImport={() => setActiveTab('import')}
                isLoading={createExpenseMutation.isLoading}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
                receiptError={receiptError}
              />
            </motion.div>
          )}

          {activeTab === 'import' && (
            <motion.div
              key="import"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ExpenseImportPanel
                fileInputRef={fileInputRef}
                onFileChange={handleImportFileChange}
                onDownloadTemplate={downloadTemplate}
                importError={importError}
                importPreview={importPreview}
                validImportCount={validImportCount}
                invalidImportCount={invalidImportCount}
                importing={importing}
                onConfirm={handleImportConfirm}
                onCancel={handleImportCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete expense?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={deleteExpenseMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                disabled={deleteExpenseMutation.isLoading}
              >
                {deleteExpenseMutation.isLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
