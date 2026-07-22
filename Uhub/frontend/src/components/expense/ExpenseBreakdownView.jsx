import { Layers3 } from 'lucide-react';
import {
  formatCurrency,
  getBreakdownRemaining,
  getBreakdownTotal,
} from '../../utils/expenseHelpers';

export default function ExpenseBreakdownView({ expense, compact = false }) {
  const breakdowns = expense.breakdowns || [];
  const totalAmount = parseFloat(expense.amount_aed) || 0;
  const breakdownTotal = getBreakdownTotal(breakdowns);
  const remaining = getBreakdownRemaining(totalAmount, breakdowns);
  const currency = expense.currency || 'AED';

  if (!breakdowns.length) return null;

  return (
    <div className={`rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/30 dark:via-gray-800 dark:to-teal-950/20 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
            <Layers3 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Spending breakdown
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {breakdowns.length} manually entered item{breakdowns.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(totalAmount, currency)}
        </p>
      </div>

      <div className="space-y-2">
        {breakdowns.map((item, index) => {
          const amount = parseFloat(item.amount) || 0;
          const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

          return (
            <div key={item.id || `${item.label}-${index}`} className="rounded-xl bg-white/80 dark:bg-gray-800/70 border border-gray-200/70 dark:border-gray-700 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {item.label}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(amount, currency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>
            </div>
          );
        })}

        {remaining > 0.009 && (
          <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm">
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-300">Unallocated</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Remaining amount not assigned to a breakdown item
              </p>
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums shrink-0">
              {formatCurrency(remaining, currency)}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-emerald-200/70 dark:border-emerald-900/50 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Breakdown allocated</span>
        <span className="font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
          {formatCurrency(breakdownTotal, currency)}
        </span>
      </div>
    </div>
  );
}
