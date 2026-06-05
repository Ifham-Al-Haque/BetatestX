import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from './NotificationBell';
import ChatPopup from './ChatPopup';
import TicketAlertToastStack from './TicketAlertToastStack';

const NotificationContainer = () => {
  const { chatPopups, removeChatPopup } = useNotifications();

  return (
    <>
      {/* Notification Bell */}
      <NotificationBell />

      {/* Ticket / assignment popups — top-right */}
      <TicketAlertToastStack />
      
      {/* Chat Popups - Displayed in center of screen */}
      <AnimatePresence>
        {chatPopups.map((popup) => (
          <ChatPopup
            key={popup.id}
            popup={popup}
            onRemove={removeChatPopup}
          />
        ))}
      </AnimatePresence>
    </>
  );
};

export default NotificationContainer;
