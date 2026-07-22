import { useMemo } from 'react';
import { Layers3, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  formatCurrency,
  getBreakdownRemaining,
  getBreakdownTotal,
} from '../../utils/expenseHelpers';

const inputClass =
  'w-full min-w-0 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

const createClientKey = () =>
  window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createEmptyBreakdown = () => ({
  _key: createClientKey(),
  label: '',
  amount: '',
  notes: '',
});

export default function ExpenseBreakdownEditor({
  expenseAmount,
  currency = 'AED',
  breakdowns = [],
  onChange,
  compact = false,
}) {
  const breakdownTotal = useMemo(() => getBreakdownTotal(breakdowns), [breakdowns]);
  const remaining = useMemo(
    () => getBreakdownRemaining(expenseAmount, breakdowns),
    [expenseAmount, breakdowns]
  );
  const parentAmount = parseFloat(expenseAmount) || 0;
  const hasBreakdowns = breakdowns.length > 0;
  const isOver = remaining < 0;
  const isComplete = hasBreakdowns && parentAmount > 0 && Math.abs(remaining) < 0.01;
  const allocatedPercent = parentAmount > 0
    ? Math.min(100, Math.max(0, (breakdownTotal / parentAmount) * 100))
    : 0;

  const updateItem = (index, field, value) => {
    onChange(breakdowns.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const removeItem = (index) => {
    onChange(breakdowns.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-4">
      {!hasBreakdowns ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-900/20 px-4 py-5 text-center">
          <Layers3 className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            No breakdown added
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            The expense will display its full total of {formatCurrency(parentAmount, currency)}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {breakdowns.map((item, index) => (
            <div
              key={item.id || item._key || index}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/70 p-3"
            >
              <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-[1fr_10rem_auto]' : 'sm:grid-cols-[1fr_11rem_auto]'} gap-2 items-start`}>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Breakdown name
                  </label>
                  <input
                    type="text"
                    value={item.label || ''}
                    onChange={(event) => updateItem(index, 'label', event.target.value)}
                    placeholder="e.g. Mobile lines, Internet, Roaming"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount ?? ''}
                    onChange={(event) => updateItem(index, 'amount', event.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="sm:mt-6 p-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors justify-self-end"
                  title="Remove breakdown item"
                  aria-label={`Remove breakdown item ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {!compact && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(event) => updateItem(index, 'notes', event.target.value)}
                    placeholder="Optional note for this item"
                    className={`${inputClass} text-sm`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange([...breakdowns, createEmptyBreakdown()])}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add breakdown item
      </button>

      {hasBreakdowns && (
        <div className={`rounded-xl border p-4 ${
          isOver
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-900/15'
        }`}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Allocated</span>
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(breakdownTotal, currency)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${allocatedPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-4 mt-2 text-sm">
            <span className={`inline-flex items-center gap-1 ${isOver ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {isOver ? <AlertCircle className="w-4 h-4" /> : isComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : null}
              {isOver ? 'Over total' : isComplete ? 'Fully allocated' : 'Unallocated'}
            </span>
            <span className={`font-semibold tabular-nums ${isOver ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
              {formatCurrency(Math.abs(remaining), currency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
