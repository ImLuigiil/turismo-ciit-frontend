// src/contexts/NotificationContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    console.log('NotificationContext: showNotification llamado con:', { message, type, duration });
    setNotification({ message, type });
    
    setTimeout(() => {
      setNotification(null);
      console.log('NotificationContext: Notificación oculta después de duración.');
    }, duration);
  }, []);

  const closeNotification = useCallback(() => {
    console.log('NotificationContext: closeNotification llamado.');
    setNotification(null);
  }, []);

  const contextValue = {
    showNotification,
    closeNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};
