import { Layers3 } from 'lucide-react';
import {
  formatCurrency,
  getBreakdownRemaining,
  getBreakdownTotal,
} from '../../utils/expenseHelpers';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function MonthlyExpenseDetailCard({ payment }) {
  const currency = payment.currency || 'AED';
  const breakdownTotal = getBreakdownTotal(payment.breakdowns);
  const unallocated = getBreakdownRemaining(payment.amount, payment.breakdowns);
  const hasUnallocated = unallocated > 0.009;
  const isOverAllocated = unallocated < -0.009;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice #</p>
          <p className="font-semibold text-gray-900 dark:text-white">{payment.invoice_number}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Total amount</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
            {formatCurrency(payment.amount, currency)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Billing period</p>
          <p className="font-semibold text-gray-900 dark:text-white">{payment.billing_period || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Due date</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(payment.due_date)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Payment date</p>
          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(payment.payment_date)}</p>
        </div>
      </div>

      {payment.hasBreakdown ? (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <Layers3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Spending breakdown
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({payment.breakdowns.length} item{payment.breakdowns.length === 1 ? '' : 's'})
            </span>
          </div>
          <div className="space-y-2">
            {payment.breakdowns.map((item, index) => {
              const itemAmount = parseFloat(item.amount) || 0;
              const share = payment.amount > 0 ? (itemAmount / payment.amount) * 100 : 0;

              return (
                <div
                  key={item.id || `${item.label}-${index}`}
                  className="flex items-start justify-between gap-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-600 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                    {item.notes?.trim() && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {item.notes.trim()}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {formatCurrency(itemAmount, currency)}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {share.toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              );
            })}

            {hasUnallocated && (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-dashed border-amber-300/80 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Unallocated</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                    Remaining amount not assigned to a breakdown item
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 tabular-nums">
                    {formatCurrency(unallocated, currency)}
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    {payment.amount > 0 ? ((unallocated / payment.amount) * 100).toFixed(1) : '0.0'}% of total
                  </p>
                </div>
              </div>
            )}

            {isOverAllocated && (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-dashed border-red-300/80 dark:border-red-700/60 bg-red-50/60 dark:bg-red-950/20 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">Over-allocated</p>
                  <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
                    Breakdown items exceed the expense total
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200 tabular-nums">
                    {formatCurrency(Math.abs(unallocated), currency)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {(hasUnallocated || isOverAllocated) && (
            <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Breakdown allocated</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatCurrency(breakdownTotal, currency)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No sub-breakdown entered — showing full expense total of{' '}
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(payment.amount, currency)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
