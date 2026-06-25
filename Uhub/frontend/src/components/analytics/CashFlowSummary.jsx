import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import { formatCurrency } from '../../utils/expenseHelpers';

function CashFlowCard({ label, value, icon: Icon, tone, delay = 0, format = 'currency' }) {
  const tones = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-200',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-200',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40 text-violet-800 dark:text-violet-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border p-4 ${tones[tone]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold">
        {format === 'number' ? value.toLocaleString() : formatCurrency(value)}
      </p>
    </motion.div>
  );
}

export default function CashFlowSummary({ summary, hasPaymentEvents }) {
  if (!hasPaymentEvents && summary.paidThisMonth === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/70 dark:border-gray-700 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cash Flow This Month</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Paid expenses vs scheduled payments
          </p>
        </div>
        <Link
          to="/upcoming-payments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          View upcoming
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <CashFlowCard
          label="Paid"
          value={summary.paidThisMonth}
          icon={CheckCircle}
          tone="emerald"
          delay={0.05}
        />
        <CashFlowCard
          label="Scheduled"
          value={summary.scheduledThisMonth}
          icon={Calendar}
          tone="blue"
          delay={0.1}
        />
        <CashFlowCard
          label="Due in 7 days"
          value={summary.dueSoon}
          icon={Clock}
          tone="amber"
          delay={0.15}
        />
        <CashFlowCard
          label="Overdue"
          value={summary.overdue}
          icon={AlertTriangle}
          tone="red"
          delay={0.2}
        />
        <CashFlowCard
          label="Recurring"
          value={summary.recurringCount}
          icon={Repeat}
          tone="violet"
          delay={0.25}
          format="number"
        />
      </div>

      {summary.scheduledThisMonth > 0 && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Net position (paid − scheduled):{' '}
          <span
            className={
              summary.netPosition >= 0
                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                : 'font-semibold text-red-600 dark:text-red-400'
            }
          >
            {formatCurrency(summary.netPosition)}
          </span>
        </p>
      )}
    </div>
  );
}
