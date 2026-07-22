import { motion } from 'framer-motion';
import { Save, X, Layers3 } from 'lucide-react';
import { DEPARTMENTS } from '../../config/departments';
import { STATUS_OPTIONS } from '../../utils/expenseHelpers';
import {
  editInputClass,
  editSelectClass,
  formatServiceName,
  serviceInitial,
} from './expenseDisplayUtils';
import ExpenseBreakdownEditor from './ExpenseBreakdownEditor';

function EditField({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </label>
      {children}
    </div>
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
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: rowIndex * 0.015 }}
      className="bg-emerald-50/70 dark:bg-emerald-900/15 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800"
    >
      <td colSpan={colSpan} className="p-0 w-full">
        <div className="p-4 min-w-0 w-full max-w-full box-border">
        <div className="flex items-start gap-3 mb-4 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-200 shrink-0">
            {serviceInitial(editForm.service_name || expense.service_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Editing {formatServiceName(editForm.service_name || expense.service_name)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Update fields below, then save or cancel.
            </p>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
            <EditField label="Service name">
              <input
                type="text"
                value={editForm.service_name}
                onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                className={editInputClass}
              />
            </EditField>

            <EditField label="Amount">
              <div className="flex gap-2 min-w-0">
                <select
                  value={editForm.currency || 'AED'}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  className={`${editSelectClass} w-[5.5rem] shrink-0`}
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
                  className={`${editInputClass} flex-1 min-w-0`}
                />
              </div>
            </EditField>

            <EditField label="Billing period" className="sm:col-span-2 lg:col-span-1">
              <input
                type="text"
                placeholder="e.g. Jan 2026"
                value={editForm.months || ''}
                onChange={(e) => setEditForm({ ...editForm, months: e.target.value })}
                className={editInputClass}
              />
            </EditField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
            <EditField label="Date paid">
              <input
                type="date"
                value={editForm.date_paid || ''}
                onChange={(e) => setEditForm({ ...editForm, date_paid: e.target.value })}
                className={editInputClass}
              />
            </EditField>

            <EditField label="Invoice #">
              <input
                type="text"
                value={editForm.invoice_number || ''}
                onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })}
                className={editInputClass}
              />
            </EditField>

            <EditField label="Gen. date">
              <input
                type="date"
                value={editForm.invoice_generation_date || ''}
                onChange={(e) => setEditForm({ ...editForm, invoice_generation_date: e.target.value })}
                className={editInputClass}
              />
            </EditField>

            <EditField label="Due date">
              <input
                type="date"
                value={editForm.invoice_due_date || ''}
                onChange={(e) => setEditForm({ ...editForm, invoice_due_date: e.target.value })}
                className={editInputClass}
              />
            </EditField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <EditField label="Department">
              <select
                value={editForm.department || ''}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className={editSelectClass}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </EditField>

            <EditField label="Status">
              <select
                value={editForm.service_status}
                onChange={(e) => setEditForm({ ...editForm, service_status: e.target.value })}
                className={editSelectClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </EditField>
          </div>

          <EditField label="Notes (optional)">
            <textarea
              rows={2}
              placeholder="Optional notes"
              value={editForm.notes || ''}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className={`${editInputClass} resize-y text-xs`}
            />
          </EditField>

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-gray-800/50 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Layers3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Spending breakdown
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  (optional)
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Add, update, or remove the manually entered items for this expense.
              </p>
            </div>
            <ExpenseBreakdownEditor
              expenseAmount={editForm.amount_aed}
              currency={editForm.currency || 'AED'}
              breakdowns={editForm.breakdowns || []}
              onChange={(breakdowns) => setEditForm({ ...editForm, breakdowns })}
              compact
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60">
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4" />
            Save changes
          </button>
        </div>
        </div>
      </td>
    </motion.tr>
  );
}
