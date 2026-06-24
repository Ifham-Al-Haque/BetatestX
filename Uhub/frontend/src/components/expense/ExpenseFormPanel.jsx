import { useMemo, useState, useRef } from 'react';
import {
  DollarSign,
  Plus,
  RotateCcw,
  FileText,
  Calendar,
  Building2,
  Upload,
  Receipt,
  AlertCircle,
  StickyNote,
  Paperclip,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { DEPARTMENTS, getDepartmentLabel } from '../../config/departments';
import { STATUS_OPTIONS, formatCurrency } from '../../utils/expenseHelpers';

const inputClass =
  'px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700/80 dark:text-white w-full transition-shadow';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';
const hintClass = 'text-xs text-gray-500 dark:text-gray-400';

const STATUS_STYLES = {
  active: {
    active: 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-gray-800',
    idle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
  },
  pending: {
    active: 'bg-amber-500 text-white ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-gray-800',
    idle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
  },
  final: {
    active: 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-800',
    idle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800',
  },
  inactive: {
    active: 'bg-gray-600 text-white ring-2 ring-gray-600 ring-offset-2 dark:ring-offset-gray-800',
    idle: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  },
};

function FormSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm shrink-0">
          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
          {subtitle && <p className={hintClass}>{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

function ExpensePreview({ form, receiptFile }) {
  const amountLabel = form.amount_aed
    ? formatCurrency(form.amount_aed, form.currency || 'AED')
    : `${form.currency || 'AED'} 0.00`;

  const formatPreviewDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusStyle = STATUS_STYLES[form.service_status]?.idle || STATUS_STYLES.inactive.idle;

  return (
    <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-gray-800 dark:to-teal-950/30 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h4 className="font-semibold text-gray-900 dark:text-white">Live preview</h4>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Service</p>
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {form.service_name || 'Untitled expense'}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Amount</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{amountLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
              {form.department ? getDepartmentLabel(form.department) : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${statusStyle}`}>
              {form.service_status}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Paid on</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{formatPreviewDate(form.date_paid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Due on</p>
            <p className="font-medium text-gray-800 dark:text-gray-200">{formatPreviewDate(form.invoice_due_date)}</p>
          </div>
        </div>

        {form.invoice_number && (
          <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
            <p className="text-xs text-gray-500 dark:text-gray-400">Invoice</p>
            <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{form.invoice_number}</p>
          </div>
        )}

        {form.notes?.trim() && (
          <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> Notes
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{form.notes.trim()}</p>
          </div>
        )}

        {receiptFile && (
          <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Paperclip className="w-3 h-3" /> Receipt
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{receiptFile.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExpenseFormPanel({
  form,
  setForm,
  onSubmit,
  onClear,
  onGoToImport,
  isLoading,
  receiptFile,
  setReceiptFile,
  receiptError,
}) {
  const [showOptional, setShowOptional] = useState(false);
  const receiptInputRef = useRef(null);
  const completion = useMemo(() => {
    let done = 0;
    if (form.service_name?.trim()) done += 1;
    if (form.amount_aed && parseFloat(form.amount_aed) > 0) done += 1;
    if (form.date_paid) done += 1;
    return { done, total: 3, percent: Math.round((done / 3) * 100) };
  }, [form]);

  const dateWarning = useMemo(() => {
    if (!form.date_paid || !form.invoice_due_date) return null;
    if (new Date(form.invoice_due_date) < new Date(form.date_paid)) {
      return 'Due date is before the paid date — double-check if this is correct.';
    }
    return null;
  }, [form.date_paid, form.invoice_due_date]);

  const handleDatePaidChange = (value) => {
    const next = { ...form, date_paid: value };
    if (value && !form.months) {
      next.months = new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    setForm(next);
  };

  const handleReceiptChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) setReceiptFile?.(file);
    e.target.value = '';
  };

  const optionalFilled = Boolean(form.notes?.trim() || receiptFile);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-blue-900/20" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Add New Expense
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Record a single invoice — required fields marked with *
            </p>
          </div>
          <div className="sm:w-48 shrink-0">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Completion</span>
              <span>{completion.done}/{completion.total} required</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Form sections */}
          <div className="xl:col-span-2 space-y-5">
            <FormSection
              icon={DollarSign}
              title="Service & amount"
              subtitle="What was paid and how much"
            >
              <Field label="Service name" required className="md:col-span-2">
                <input
                  type="text"
                  placeholder="e.g. AWS Hosting, Microsoft 365"
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Amount" required>
                <div className="flex gap-2">
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className={`${inputClass} w-24 shrink-0`}
                    aria-label="Currency"
                  >
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.amount_aed}
                    onChange={(e) => setForm({ ...form, amount_aed: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className={inputClass}
                  />
                </div>
              </Field>

              <Field
                label="Billing period"
                hint="Which month or period this expense covers"
              >
                <input
                  type="text"
                  placeholder="e.g. Jan 2025"
                  value={form.months}
                  onChange={(e) => setForm({ ...form, months: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormSection>

            <FormSection
              icon={FileText}
              title="Invoice details"
              subtitle="Reference numbers and ownership"
            >
              <Field label="Invoice number">
                <input
                  type="text"
                  placeholder="INV-2025-001"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Department">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </Field>
            </FormSection>

            <FormSection
              icon={Calendar}
              title="Dates & status"
              subtitle="Payment timeline and current state"
            >
              <Field label="Paid on" required>
                <input
                  type="date"
                  value={form.date_paid}
                  onChange={(e) => handleDatePaidChange(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Invoice generated on">
                <input
                  type="date"
                  value={form.invoice_generation_date}
                  onChange={(e) => setForm({ ...form, invoice_generation_date: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Invoice due on">
                <input
                  type="date"
                  value={form.invoice_due_date}
                  onChange={(e) => setForm({ ...form, invoice_due_date: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Status" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const styles = STATUS_STYLES[opt.value] || STATUS_STYLES.inactive;
                    const isActive = form.service_status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, service_status: opt.value })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border capitalize transition-all ${
                          isActive ? styles.active : `${styles.idle} hover:opacity-90`
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </FormSection>

            {/* Optional details — collapsed by default */}
            <section className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="w-full px-5 py-4 flex items-center justify-between text-left bg-gray-50/80 dark:bg-gray-900/30 hover:bg-gray-100/80 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                    <StickyNote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      Optional details
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(not required)</span>
                      {optionalFilled && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Added
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Notes and invoice/receipt attachment
                    </p>
                  </div>
                </div>
                {showOptional ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {showOptional && (
                <div className="p-5 space-y-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                  <Field
                    label="Notes"
                    hint="Internal context — e.g. renewal terms, PO reference, approval note"
                  >
                    <textarea
                      rows={3}
                      placeholder="Add any extra details about this expense…"
                      value={form.notes || ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={`${inputClass} resize-y min-h-[88px]`}
                    />
                  </Field>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Receipt / invoice file</label>
                    <input
                      ref={receiptInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                      onChange={handleReceiptChange}
                      className="hidden"
                    />
                    {!receiptFile ? (
                      <button
                        type="button"
                        onClick={() => receiptInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-center"
                      >
                        <Paperclip className="w-6 h-6 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Attach PDF or image
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          PDF, JPG, PNG, WEBP · max 10 MB
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {receiptFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceiptFile?.(null)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {receiptError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{receiptError}</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {dateWarning && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {dateWarning}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Clear form
              </button>
              <button
                type="submit"
                disabled={isLoading || completion.done < completion.total || Boolean(receiptError)}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-2.5 rounded-xl transition-all disabled:opacity-50 font-medium shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                {isLoading ? 'Adding…' : 'Add Expense'}
              </button>
            </div>
          </div>

          {/* Preview sidebar */}
          <div className="space-y-4">
            <div className="xl:sticky xl:top-6 space-y-4">
              <ExpensePreview form={form} receiptFile={receiptFile} />

              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-4 bg-gray-50/50 dark:bg-gray-900/20">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Adding many at once?</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use bulk import for spreadsheet uploads instead of entering one by one.
                    </p>
                    {onGoToImport && (
                      <button
                        type="button"
                        onClick={onGoToImport}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Go to Import
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
