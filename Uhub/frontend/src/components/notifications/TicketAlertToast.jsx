import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Zap,
  AlertCircle,
  Lightbulb,
  Wrench,
  CheckCircle,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { getSafeInternalUrl } from '../../utils/security';

const TYPE_STYLES = {
  it_request: {
    gradient: 'from-teal-600 to-cyan-600',
    icon: Zap,
  },
  it_request_assigned: {
    gradient: 'from-teal-600 to-emerald-600',
    icon: Zap,
  },
  it_request_update: {
    gradient: 'from-blue-600 to-indigo-600',
    icon: Zap,
  },
  complaint: {
    gradient: 'from-violet-600 to-purple-600',
    icon: AlertCircle,
  },
  complaint_update: {
    gradient: 'from-violet-600 to-purple-600',
    icon: AlertCircle,
  },
  suggestion: {
    gradient: 'from-amber-500 to-orange-500',
    icon: Lightbulb,
  },
  fleet_task_assigned: {
    gradient: 'from-blue-600 to-indigo-600',
    icon: Wrench,
  },
  task_assigned: {
    gradient: 'from-emerald-600 to-green-600',
    icon: CheckCircle,
  },
  task_assignment: {
    gradient: 'from-emerald-600 to-green-600',
    icon: CheckCircle,
  },
};

function getToastStyle(type) {
  return TYPE_STYLES[type] || { gradient: 'from-slate-600 to-slate-700', icon: Bell };
}

const TicketAlertToast = ({ toast, index, onDismiss }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const durationSec = toast.durationSec ?? 10;
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const { gradient, icon: Icon } = getToastStyle(toast.type);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 280);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [toast.id, onDismiss]);

  const handleView = () => {
    const safe = getSafeInternalUrl(toast.actionUrl);
    if (safe) navigate(safe);
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  if (!visible) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed z-[1100] w-full max-w-sm pointer-events-auto"
      style={{ top: `${88 + index * 132}px`, right: '20px' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden bg-white">
        <div className={`bg-gradient-to-r ${gradient} px-4 py-3 text-white`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{toast.title}</p>
                {(toast.priority === 'high' || toast.priority === 'urgent') && (
                  <span className="text-[10px] uppercase tracking-wide text-white/80 font-medium">
                    {toast.priority} priority
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-white/70 tabular-nums">{timeLeft}s</span>
              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => onDismiss(toast.id), 200);
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 line-clamp-3">{toast.message}</p>
          <div className="flex items-center justify-end gap-2 mt-3">
            {toast.actionUrl && (
              <button
                type="button"
                onClick={handleView}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {toast.actionLabel || 'View'}
              </button>
            )}
          </div>
        </div>

        <div className="h-1 bg-gray-100">
          <motion.div
            className={`h-full bg-gradient-to-r ${gradient}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: durationSec, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TicketAlertToast;
