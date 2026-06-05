import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import TicketAlertToast from './TicketAlertToast';

const TicketAlertToastStack = () => {
  const { toastAlerts, removeToastAlert } = useNotifications();

  return (
    <div className="fixed inset-0 pointer-events-none z-[1100]" aria-hidden={toastAlerts.length === 0}>
      <AnimatePresence mode="popLayout">
        {toastAlerts.map((toast, index) => (
          <TicketAlertToast
            key={toast.id}
            toast={toast}
            index={index}
            onDismiss={removeToastAlert}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TicketAlertToastStack;
