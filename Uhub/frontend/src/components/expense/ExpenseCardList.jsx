import { motion } from 'framer-motion';
import {
  Edit,
  Trash,
  Save,
  X,
  Paperclip,
  StickyNote,
  ExternalLink,
  AlertCircle,
  Calendar,
  Hash,
  Layers3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DEPARTMENTS } from '../../config/departments';
import {
  formatCurrency,
  STATUS_OPTIONS,
  BILLING_TYPE_OPTIONS,
  getBillingPeriodFromPaymentDate,
} from '../../utils/expenseHelpers';
import {
  StatusBadge,
  BillingTypeBadge,
  DepartmentBadge,
  formatDate,
  formatServiceName,
  serviceInitial,
  isOverdue,
  editInputClass,
  editSelectClass,
} from './expenseDisplayUtils';
import ExpenseBreakdownEditor from './ExpenseBreakdownEditor';
import ExpenseBreakdownView from './ExpenseBreakdownView';

function DetailRow({ icon: Icon, label, value, warn }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${warn ? 'text-red-500' : 'text-gray-400'}`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        <p className={`font-medium truncate ${warn ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ExpenseCardList({
  expenses,
  editingId,
  editForm,
  setEditForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  visibleColumns,
  expandedExpenseIds,
  onToggleBreakdown,
}) {
  const show = (key) => visibleColumns[key] !== false;

  if (!expenses.length) return null;

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {expenses.map((expense, index) => {
        const isEditing = editingId === expense.id;
        const overdue = isOverdue(expense.invoice_due_date, expense.service_status);
        const hasBreakdown = (expense.breakdowns || []).length > 0;
        const isExpanded = expandedExpenseIds.has(expense.id);

        return (
          <motion.article
            key={expense.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
              isEditing
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 ring-2 ring-emerald-200 dark:ring-emerald-800'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90'
            }`}
          >
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.service_name}
                    onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                    className={editInputClass}
                    placeholder="Service name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editForm.amount_aed}
                      onChange={(e) => setEditForm({ ...editForm, amount_aed: e.target.value })}
                      className={`${editInputClass} min-w-0`}
                      placeholder="Amount"
                    />
                    <select
                      value={editForm.currency || 'AED'}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className={editSelectClass}
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Billing period e.g. Jan 2026"
                    value={editForm.months || ''}
                    onChange={(e) => setEditForm({ ...editForm, months: e.target.value })}
                    className={editInputClass}
                  />
                  <select
                    value={editForm.billing_type || ''}
                    onChange={(e) => {
                      const billingType = e.target.value;
                      setEditForm({
                        ...editForm,
                        billing_type: billingType || null,
                        months: getBillingPeriodFromPaymentDate(editForm.date_paid, billingType),
                      });
                    }}
                    className={editSelectClass}
                  >
                    <option value="">Billing type not specified</option>
                    {BILLING_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editForm.date_paid}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      date_paid: e.target.value,
                      months: editForm.billing_type
                        ? getBillingPeriodFromPaymentDate(e.target.value, editForm.billing_type)
                        : editForm.months,
                    })}
                    className={editInputClass}
                  />
                  <select
                    value={editForm.department || ''}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className={editSelectClass}
                  >
                    <option value="">Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <select
                    value={editForm.service_status}
                    onChange={(e) => setEditForm({ ...editForm, service_status: e.target.value })}
                    className={editSelectClass}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    placeholder="Notes (optional)"
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className={`${editInputClass} resize-y text-xs`}
                  />
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                      <Layers3 className="w-3.5 h-3.5" />
                      Spending breakdown (optional)
                    </p>
                    <ExpenseBreakdownEditor
                      expenseAmount={editForm.amount_aed}
                      currency={editForm.currency || 'AED'}
                      breakdowns={editForm.breakdowns || []}
                      onChange={(breakdowns) => setEditForm({ ...editForm, breakdowns })}
                      compact
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-200 shrink-0">
                        {serviceInitial(expense.service_name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white leading-tight">
                          {formatServiceName(expense.service_name)}
                        </h4>
                        {show('department') && expense.department && (
                          <div className="mt-1.5">
                            <DepartmentBadge department={expense.department} />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                      {formatCurrency(expense.amount_aed, expense.currency || 'AED')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {show('service_status') && <StatusBadge status={expense.service_status} />}
                    {show('billing_type') && (
                      <BillingTypeBadge
                        billingType={expense.billing_type}
                        billingPeriod={expense.months}
                      />
                    )}
                    {overdue && show('invoice_due_date') && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {show('date_paid') && (
                      <DetailRow icon={Calendar} label="Paid" value={formatDate(expense.date_paid)} />
                    )}
                    {show('invoice_due_date') && (
                      <DetailRow
                        icon={Calendar}
                        label="Due"
                        value={formatDate(expense.invoice_due_date)}
                        warn={overdue}
                      />
                    )}
                    {show('invoice_generation_date') && (
                      <DetailRow icon={Calendar} label="Generated" value={formatDate(expense.invoice_generation_date)} />
                    )}
                    {show('invoice_number') && expense.invoice_number && (
                      <DetailRow icon={Hash} label="Invoice" value={expense.invoice_number} />
                    )}
                  </div>

                  {expense.notes?.trim() && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-start gap-1 line-clamp-2">
                      <StickyNote className="w-3 h-3 shrink-0 mt-0.5" />
                      {expense.notes.trim()}
                    </p>
                  )}

                  {expense.receipt_url && (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline mb-2"
                    >
                      <Paperclip className="w-3 h-3" />
                      {expense.receipt_file_name || 'View receipt'}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}

                  {hasBreakdown && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => onToggleBreakdown(expense.id)}
                        className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/35 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Layers3 className="w-4 h-4" />
                          {expense.breakdowns.length} breakdown item{expense.breakdowns.length === 1 ? '' : 's'}
                        </span>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-3">
                          <ExpenseBreakdownView expense={expense} compact />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30 flex justify-end gap-1">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onStartEdit(expense)}
                    className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(expense.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
