import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  X,
  Layers3,
  ReceiptText,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  StickyNote,
} from 'lucide-react';
import { DEPARTMENTS } from '../../config/departments';
import {
  STATUS_OPTIONS,
  BILLING_TYPE_OPTIONS,
  formatCurrency,
  getBreakdownTotal,
  getBillingPeriodFromPaymentDate,
  getBillingExplanation,
} from '../../utils/expenseHelpers';
import {
  formatServiceName,
  serviceInitial,
} from './expenseDisplayUtils';
import ExpenseBreakdownEditor from './ExpenseBreakdownEditor';

const editControlClass =
  'w-full min-w-0 box-border px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/80 text-sm text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors';

const editSelectControlClass = `${editControlClass} pr-9`;

function EditField({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function EditSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-200/90 dark:border-gray-700 bg-white/90 dark:bg-gray-800/70 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/25">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function ExpenseInlineEditRow({
  expense,
  editForm,
  setEditForm,
  colSpan,
  rowIndex,
  onSaveEdit,
  onCancelEdit,
}) {
  const [showBreakdown, setShowBreakdown] = useState(
    () => (editForm.breakdowns || []).length > 0
  );
  const breakdownCount = (editForm.breakdowns || []).length;
  const billingExplanation = getBillingExplanation(
    editForm.date_paid,
    editForm.billing_type
  );

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: rowIndex * 0.015 }}
      className="bg-emerald-50/70 dark:bg-emerald-900/15 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800"
    >
      <td colSpan={colSpan} className="p-0 !w-full">
        <div className="min-w-0 w-full box-border">
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-100/80 via-teal-50/80 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-gray-800 border-b border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm flex items-center justify-center text-sm font-bold shrink-0">
                  {serviceInitial(editForm.service_name || expense.service_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                    Editing {formatServiceName(editForm.service_name || expense.service_name)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Changes are saved only when you select Save changes.
                  </p>
                </div>
              </div>
              <div className="self-start sm:self-auto px-3 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Expense total</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {formatCurrency(editForm.amount_aed, editForm.currency || 'AED')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 min-w-0">
            <EditSection
              icon={ReceiptText}
              title="Expense details"
              subtitle="Service, amount, and ownership"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 min-w-0">
                <EditField label="Service name" className="xl:col-span-5">
                  <input
                    type="text"
                    value={editForm.service_name}
                    onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                    className={editControlClass}
                  />
                </EditField>

                <EditField label="Amount" className="xl:col-span-4">
                  <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-2 min-w-0">
                    <select
                      value={editForm.currency || 'AED'}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className={editSelectControlClass}
                      aria-label="Currency"
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <input
                      type="number"
                      value={editForm.amount_aed}
                      onChange={(e) => setEditForm({ ...editForm, amount_aed: e.target.value })}
                      min="0"
                      step="0.01"
                      className={editControlClass}
                      aria-label="Expense amount"
                    />
                  </div>
                </EditField>

                <EditField label="Department" className="md:col-span-2 xl:col-span-3">
                  <select
                    value={editForm.department || ''}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className={editSelectControlClass}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                </EditField>
              </div>
            </EditSection>

            <EditSection
              icon={CalendarClock}
              title="Billing & invoice"
              subtitle="Coverage period, payment timing, and invoice dates"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                <EditField label="Billing type">
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
                    className={editSelectControlClass}
                  >
                    <option value="">Not specified</option>
                    {BILLING_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </EditField>

                <EditField label="Service month">
                  <input
                    type="text"
                    placeholder="e.g. Jan 2026"
                    value={editForm.months || ''}
                    onChange={(e) => setEditForm({ ...editForm, months: e.target.value })}
                    className={editControlClass}
                  />
                </EditField>

                <EditField label="Status" className="md:col-span-2 xl:col-span-1">
                  <select
                    value={editForm.service_status}
                    onChange={(e) => setEditForm({ ...editForm, service_status: e.target.value })}
                    className={editSelectControlClass}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </EditField>
              </div>

              {billingExplanation && (
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200">
                  {billingExplanation} The service month can still be adjusted manually.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <EditField label="Date paid">
                  <input
                    type="date"
                    value={editForm.date_paid || ''}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      date_paid: e.target.value,
                      months: editForm.billing_type
                        ? getBillingPeriodFromPaymentDate(e.target.value, editForm.billing_type)
                        : editForm.months,
                    })}
                    className={editControlClass}
                  />
                </EditField>

                <EditField label="Invoice #">
                  <input
                    type="text"
                    value={editForm.invoice_number || ''}
                    onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })}
                    className={editControlClass}
                  />
                </EditField>

                <EditField label="Generation date">
                  <input
                    type="date"
                    value={editForm.invoice_generation_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, invoice_generation_date: e.target.value })}
                    className={editControlClass}
                  />
                </EditField>

                <EditField label="Due date">
                  <input
                    type="date"
                    value={editForm.invoice_due_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, invoice_due_date: e.target.value })}
                    className={editControlClass}
                  />
                </EditField>
              </div>
            </EditSection>

            <EditSection
              icon={StickyNote}
              title="Notes"
              subtitle="Optional context for this expense"
            >
              <textarea
                rows={3}
                placeholder="Add internal notes, billing context, or follow-up details…"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className={`${editControlClass} resize-y`}
                aria-label="Expense notes"
              />
            </EditSection>

            <section className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-800/70 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBreakdown((current) => !current)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-emerald-50/60 dark:hover:bg-emerald-900/15 transition-colors"
                aria-expanded={showBreakdown}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Layers3 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Spending breakdown <span className="font-normal text-gray-500">(optional)</span>
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {breakdownCount
                        ? `${breakdownCount} item${breakdownCount === 1 ? '' : 's'} · ${formatCurrency(getBreakdownTotal(editForm.breakdowns), editForm.currency || 'AED')} allocated`
                        : 'No breakdown added — the full expense total will be displayed'}
                    </span>
                  </span>
                </span>
                {showBreakdown
                  ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
              </button>

              {showBreakdown && (
                <div className="p-4 border-t border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <ExpenseBreakdownEditor
                    expenseAmount={editForm.amount_aed}
                    currency={editForm.currency || 'AED'}
                    breakdowns={editForm.breakdowns || []}
                    onChange={(breakdowns) => setEditForm({ ...editForm, breakdowns })}
                    compact
                  />
                </div>
              )}
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}
