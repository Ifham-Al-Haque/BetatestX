import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Edit,
  Trash,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  StickyNote,
  ExternalLink,
  List,
  AlertCircle,
  LayoutGrid,
  Table2,
  Columns3,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, PAGE_SIZE_OPTIONS, getExpenseAmount } from '../../utils/expenseHelpers';
import ExpenseCardList from './ExpenseCardList';
import ExpenseInlineEditRow from './ExpenseInlineEditRow';
import {
  COLUMN_DEFS,
  StatusBadge,
  DepartmentBadge,
  formatDate,
  formatServiceName,
  serviceInitial,
  isOverdue,
  loadColumnVisibility,
  saveColumnVisibility,
  loadViewMode,
  saveViewMode,
  getDefaultColumnVisibility,
} from './expenseDisplayUtils';

function SortIcon({ field, sortField, sortDirection }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-35" />;
  return sortDirection === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    : <ChevronDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ totalAll, onClearFilters }) {
  return (
    <div className="px-6 py-20 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <List className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {totalAll === 0 ? 'No expenses yet' : 'No expenses match your filters'}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {totalAll === 0
            ? 'Add your first expense using the Add Expense tab.'
            : 'Try clearing filters or broadening your search.'}
        </p>
        {totalAll > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl transition-colors font-medium"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}

function PaginationFooter({ safePage, totalPages, startIndex, pageSize, expensesLength, pageTotalAmount, onPageChange }) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col lg:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
        Page {safePage} of {totalPages} · showing {startIndex + 1}–{Math.min(startIndex + pageSize, expensesLength)} of {expensesLength}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          Page total: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(pageTotalAmount)}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-40 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium disabled:opacity-40 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseTable({
  expenses,
  totalFiltered,
  totalAll,
  isLoading,
  editingId,
  editForm,
  setEditForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}) {
  const [viewMode, setViewMode] = useState(loadViewMode);
  const [visibleColumns, setVisibleColumns] = useState(loadColumnVisibility);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  const visibleColumnDefs = useMemo(
    () => COLUMN_DEFS.filter((col) => visibleColumns[col.key]),
    [visibleColumns]
  );

  const totalPages = Math.max(1, Math.ceil(expenses.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageExpenses = expenses.slice(startIndex, startIndex + pageSize);

  const filteredTotalAmount = useMemo(
    () => expenses.reduce((sum, exp) => sum + getExpenseAmount(exp), 0),
    [expenses]
  );

  const pageTotalAmount = useMemo(
    () => pageExpenses.reduce((sum, exp) => sum + getExpenseAmount(exp), 0),
    [pageExpenses]
  );

  const setViewModePersisted = useCallback((mode) => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  const toggleColumn = useCallback((key) => {
    const col = COLUMN_DEFS.find((c) => c.key === key);
    if (col?.locked) return;
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveColumnVisibility(next);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    const defaults = getDefaultColumnVisibility();
    setVisibleColumns(defaults);
    saveColumnVisibility(defaults);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
    };
    if (showColumnMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnMenu]);

  const renderCell = (colKey, expense, overdue) => {
    switch (colKey) {
      case 'service_name':
        return (
          <div className="flex items-start gap-3 min-w-[180px] max-w-[240px]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-200 shrink-0 shadow-sm">
              {serviceInitial(expense.service_name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate" title={expense.service_name}>
                {formatServiceName(expense.service_name)}
              </p>
              {expense.notes?.trim() && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 flex items-start gap-1">
                  <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                  {expense.notes.trim()}
                </p>
              )}
              {expense.receipt_url && (
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Paperclip className="w-3 h-3" />
                  Receipt
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>
        );

      case 'invoice_number':
        return (
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200/80 dark:border-gray-600">
            {expense.invoice_number || '—'}
          </span>
        );

      case 'invoice_generation_date':
        return formatDate(expense.invoice_generation_date);

      case 'invoice_due_date':
        return (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
            {overdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {formatDate(expense.invoice_due_date)}
          </span>
        );

      case 'amount_aed':
        return (
          <span className="font-bold text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(expense.amount_aed, expense.currency || 'AED')}
          </span>
        );

      case 'date_paid':
        return formatDate(expense.date_paid);

      case 'department':
        return <DepartmentBadge department={expense.department} />;

      case 'service_status':
        return <StatusBadge status={expense.service_status} />;

      default:
        return null;
    }
  };

  const stickyBg = (isEditing, rowIndex, hover = false) => {
    if (isEditing) return 'bg-emerald-50/95 dark:bg-emerald-900/20';
    if (rowIndex % 2 === 0) return hover ? 'bg-emerald-50/30 dark:bg-gray-700/40' : 'bg-white dark:bg-gray-800';
    return hover ? 'bg-emerald-50/30 dark:bg-gray-700/40' : 'bg-gray-50/95 dark:bg-gray-800/95';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-gray-100 dark:bg-gray-700/60 animate-pulse mt-2" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800 dark:to-gray-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shrink-0">
              <List className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Expense records</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {totalFiltered === totalAll
                  ? `${totalAll} records`
                  : `${totalFiltered} matching · ${totalAll} total`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/50">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Filtered total</p>
              <p className="text-base font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">
                {formatCurrency(filteredTotalAmount)}
              </p>
            </div>

            {/* View mode toggle */}
            <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 p-0.5 bg-gray-100 dark:bg-gray-700/50">
              <button
                type="button"
                onClick={() => setViewModePersisted('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Table view"
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewModePersisted('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Column visibility — table only */}
            {viewMode === 'table' && (
              <div className="relative" ref={columnMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowColumnMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Columns3 className="w-4 h-4" />
                  Columns
                </button>
                {showColumnMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 z-30 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                      Show columns
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {COLUMN_DEFS.map((col) => (
                        <label
                          key={col.key}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                            col.locked
                              ? 'opacity-60 cursor-not-allowed'
                              : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!visibleColumns[col.key]}
                            disabled={col.locked}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-gray-800 dark:text-gray-200">{col.label}</span>
                          {col.locked && (
                            <span className="text-[10px] text-gray-400 ml-auto">Required</span>
                          )}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={resetColumns}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to default
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="hidden sm:inline">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {pageExpenses.length === 0 ? (
        <EmptyState totalAll={totalAll} onClearFilters={onClearFilters} />
      ) : viewMode === 'cards' ? (
        <ExpenseCardList
          expenses={pageExpenses}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          onStartEdit={onStartEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
          visibleColumns={visibleColumns}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-gray-50/90 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                {visibleColumnDefs.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } ${col.key === 'service_name' ? 'sticky left-0 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 transition-colors ${
                        col.align === 'right' ? 'ml-auto' : ''
                      } ${
                        sortField === col.key
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      {col.label}
                      <SortIcon field={col.key} sortField={sortField} sortDirection={sortDirection} />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/80">
              {pageExpenses.map((expense, rowIndex) => {
                const isEditing = editingId === expense.id;
                const overdue = isOverdue(expense.invoice_due_date, expense.service_status);

                if (isEditing) {
                  return (
                    <ExpenseInlineEditRow
                      key={expense.id}
                      expense={expense}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      colSpan={visibleColumnDefs.length + 1}
                      rowIndex={rowIndex}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                    />
                  );
                }

                return (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: rowIndex * 0.015 }}
                    className={`group transition-colors ${
                      rowIndex % 2 === 0
                        ? 'bg-white dark:bg-gray-800 hover:bg-emerald-50/30 dark:hover:bg-gray-700/40'
                        : 'bg-gray-50/40 dark:bg-gray-800/60 hover:bg-emerald-50/30 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    {visibleColumnDefs.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : ''
                        } ${
                          col.key === 'service_name'
                            ? `sticky left-0 z-10 ${stickyBg(false, rowIndex, true)} group-hover:bg-emerald-50/30 dark:group-hover:bg-gray-700/40`
                            : ''
                        } ${col.key === 'amount_aed' ? 'text-gray-900 dark:text-white' : ''}`}
                      >
                        {renderCell(col.key, expense, overdue)}
                      </td>
                    ))}
                    <td className="px-4 py-3.5 text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => onStartEdit(expense)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 opacity-80 group-hover:opacity-100" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => onDelete(expense.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-80 group-hover:opacity-100" title="Delete">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {expenses.length > 0 && (
        <PaginationFooter
          safePage={safePage}
          totalPages={totalPages}
          startIndex={startIndex}
          pageSize={pageSize}
          expensesLength={expenses.length}
          pageTotalAmount={pageTotalAmount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
