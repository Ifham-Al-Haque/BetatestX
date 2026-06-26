import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Save,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useUpdateExpense } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getExpenseAmount } from '../../utils/expenseHelpers';
import {
  parseMonthsToMonthKey,
  suggestBillingPeriod,
} from '../../utils/analyticsHelpers';
import { editInputClass, formatDate, formatServiceName } from '../expense/expenseDisplayUtils';

function formatPaidDate(expense) {
  return formatDate(expense.date_paid || expense.invoice_due_date || expense.invoice_generation_date);
}

export default function MissingBillingPeriodPanel({
  expenses = [],
  expanded: controlledExpanded,
  onExpandedChange,
}) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;
  const [drafts, setDrafts] = useState({});
  const [savingIds, setSavingIds] = useState(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const updateExpense = useUpdateExpense();
  const { success, error: showError } = useToast();

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      expenses.forEach((expense) => {
        if (next[expense.id] == null) {
          next[expense.id] = expense.months?.trim() || suggestBillingPeriod(expense) || '';
        }
      });
      return next;
    });
  }, [expenses]);

  const excludedTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0),
    [expenses]
  );

  const readyToSaveCount = useMemo(
    () =>
      expenses.filter((expense) => {
        const value = drafts[expense.id]?.trim();
        return value && parseMonthsToMonthKey(value);
      }).length,
    [expenses, drafts]
  );

  const setDraft = useCallback((id, value) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  }, []);

  const saveBillingPeriod = useCallback(
    async (expense) => {
      const value = drafts[expense.id]?.trim();
      if (!value) {
        showError('Billing period required', 'Enter a value like Jan 2026.');
        return;
      }
      if (!parseMonthsToMonthKey(value)) {
        showError('Invalid format', 'Use a format like Jan 2026 or 01/2026.');
        return;
      }

      setSavingIds((prev) => new Set(prev).add(expense.id));
      try {
        await updateExpense.mutateAsync({
          id: expense.id,
          data: { months: value },
        });
        success('Saved', `${formatServiceName(expense.service_name)} added to ${value}.`);
      } catch (err) {
        showError('Save failed', err.message || 'Could not update expense.');
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(expense.id);
          return next;
        });
      }
    },
    [drafts, updateExpense, success, showError]
  );

  const fillAllSuggested = useCallback(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      expenses.forEach((expense) => {
        const suggested = suggestBillingPeriod(expense);
        if (suggested) next[expense.id] = suggested;
      });
      return next;
    });
  }, [expenses]);

  const saveAllReady = useCallback(async () => {
    const targets = expenses.filter((expense) => {
      const value = drafts[expense.id]?.trim();
      return value && parseMonthsToMonthKey(value);
    });

    if (!targets.length) {
      showError('Nothing to save', 'Fill billing periods using the suggested values first.');
      return;
    }

    setBulkSaving(true);
    let saved = 0;

    try {
      for (const expense of targets) {
        await updateExpense.mutateAsync({
          id: expense.id,
          data: { months: drafts[expense.id].trim() },
        });
        saved += 1;
      }
      success('All saved', `${saved} expense${saved === 1 ? '' : 's'} added to the monthly trend.`);
    } catch (err) {
      showError(
        'Bulk save incomplete',
        saved > 0
          ? `${saved} saved before an error: ${err.message || 'Please retry remaining rows.'}`
          : err.message || 'Could not update expenses.'
      );
    } finally {
      setBulkSaving(false);
    }
  }, [expenses, drafts, updateExpense, success, showError]);

  if (!expenses.length) return null;

  return (
    <div
      id="missing-billing-period-panel"
      className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-900/10 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-start sm:items-center justify-between gap-3 px-4 py-3 text-left hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {expenses.length} expense{expenses.length === 1 ? '' : 's'} excluded from this chart
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
              Missing or invalid billing period • {formatCurrency(excludedTotal)} not counted
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-1 sm:mt-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-1 sm:mt-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-amber-200/80 dark:border-amber-800/50">
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={fillAllSuggested}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Fill all from date paid
                </button>
                <button
                  type="button"
                  onClick={saveAllReady}
                  disabled={bulkSaving || readyToSaveCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                >
                  {bulkSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save all ({readyToSaveCount})
                </button>
                <Link
                  to="/expenses?fixBillingPeriod=1"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-200 hover:underline"
                >
                  Open in Expense Tracker
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/40 bg-white/80 dark:bg-gray-900/30 overflow-hidden">
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="sticky top-0 bg-amber-50 dark:bg-gray-900/90 z-10">
                      <tr className="text-left text-[11px] uppercase tracking-wide text-amber-800/70 dark:text-amber-200/70">
                        <th className="px-3 py-2 font-semibold">Service</th>
                        <th className="px-3 py-2 font-semibold">Amount</th>
                        <th className="px-3 py-2 font-semibold">Date paid</th>
                        <th className="px-3 py-2 font-semibold min-w-[220px]">Billing period</th>
                        <th className="px-3 py-2 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-amber-900/40">
                      {expenses.map((expense) => {
                        const draft = drafts[expense.id] ?? '';
                        const isValid = !draft.trim() || !!parseMonthsToMonthKey(draft);
                        const suggested = suggestBillingPeriod(expense);
                        const isSaving = savingIds.has(expense.id);

                        return (
                          <tr key={expense.id} className="text-gray-700 dark:text-gray-300">
                            <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                              <span className="line-clamp-2" title={expense.service_name}>
                                {formatServiceName(expense.service_name)}
                              </span>
                              {expense.months?.trim() && !parseMonthsToMonthKey(expense.months) && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                                  Current: &quot;{expense.months.trim()}&quot; (unrecognized)
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                              {formatCurrency(expense.amount_aed, expense.currency || 'AED')}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">{formatPaidDate(expense)}</td>
                            <td className="px-3 py-2.5">
                              <input
                                type="text"
                                value={draft}
                                onChange={(e) => setDraft(expense.id, e.target.value)}
                                placeholder="e.g. Jan 2026"
                                className={`${editInputClass} ${!isValid ? 'border-red-400 dark:border-red-500' : ''}`}
                              />
                              {suggested && draft !== suggested && (
                                <button
                                  type="button"
                                  onClick={() => setDraft(expense.id, suggested)}
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Use {suggested}
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => saveBillingPeriod(expense)}
                                disabled={isSaving || !draft.trim() || !isValid}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                Save
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-[11px] text-amber-800/70 dark:text-amber-200/70">
                Accepted formats: Jan 2026, January 2026, 06/2026, 2026-06
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
