// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppContent from './components/AppContent';
import { NotificationProvider } from './contexts/NotificationContext'; // ¡Importa el proveedor!

import './App.css';

function App() {
  return (
    <Router>
      {/* Envuelve AppContent con NotificationProvider para que todos los componentes tengan acceso */}
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;