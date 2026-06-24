import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, Clock, FileCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/expenseHelpers';

const STAT_CARDS = [
  {
    key: 'totalAmount',
    label: 'Total amount',
    icon: DollarSign,
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-900/30',
    text: 'text-blue-700 dark:text-blue-200',
    valueText: 'text-blue-900 dark:text-white',
    format: (stats) => formatCurrency(stats.totalAmount),
  },
  {
    key: 'activeCount',
    label: 'Active',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-200',
    valueText: 'text-emerald-900 dark:text-white',
    format: (stats) => stats.activeCount,
  },
  {
    key: 'pendingCount',
    label: 'Pending',
    icon: Clock,
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-900/30',
    text: 'text-amber-700 dark:text-amber-200',
    valueText: 'text-amber-900 dark:text-white',
    format: (stats) => stats.pendingCount,
  },
  {
    key: 'finalCount',
    label: 'Final',
    icon: FileCheck,
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-200',
    valueText: 'text-indigo-900 dark:text-white',
    format: (stats) => stats.finalCount,
  },
];

export default function ExpenseStatsCards({ stats, totalCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {STAT_CARDS.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className={`relative overflow-hidden p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 ${card.bg} ${card.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-medium ${card.text}`}>{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.valueText}`}>
                  {card.format(stats)}
                </p>
                {card.key === 'totalAmount' && (
                  <p className="text-xs mt-1 opacity-70 text-gray-600 dark:text-gray-400">
                    {totalCount} record{totalCount === 1 ? '' : 's'} in view
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
