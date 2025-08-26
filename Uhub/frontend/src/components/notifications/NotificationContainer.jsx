import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from './NotificationBell';
import ChatPopup from './ChatPopup';

const NotificationContainer = () => {
  const { chatPopups, removeChatPopup } = useNotifications();

  return (
    <>
      {/* Notification Bell */}
      <NotificationBell />
      
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
