// src/components/Notification.js
import React, { useEffect, useState } from 'react';
import './Notification.css'; // Crearemos este archivo CSS

function Notification({ message, type, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      console.log('Notification Component: Haciendo visible. Mensaje:', message); // <-- LOG AÑADIDO
      const timer = setTimeout(() => {
        setIsVisible(false);
        console.log('Notification Component: Ocultando después de duración.'); // <-- LOG AÑADIDO
        if (onClose) {
          onClose();
        }
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      console.log('Notification Component: No visible (sin mensaje).'); // <-- LOG AÑADIDO
    }
  }, [message, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`notification-container ${type}`}>
      <p>{message}</p>
      <button onClick={() => setIsVisible(false)} className="notification-close-btn">X</button>
    </div>
  );
}

export default Notification;
