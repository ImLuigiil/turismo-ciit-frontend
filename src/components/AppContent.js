// src/components/AppContent.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importa los componentes
import Header from './Header';
import HomePage from './HomePage';
import ProyectosTurismoComunitarioPage from './ProyectosTurismoComunitarioPage';
import ProjectDetailPage from './ProjectDetailPage';
import ProjectForm from './ProjectForm';
import LoginPage from './LoginPage';
import DiplomadosPage from './DiplomadosPage';
import AddDiplomadoForm from './AddDiplomadoForm';
import CommunityForm from './CommunityForm.js';
import CursoForm from './CursoForm';
import CursosPage from './CursosPage';
import FotosPage from './FotosPage';
import MunicipioGalleryPage from './MunicipioGalleryPage';
import ReportesPage from './ReportesPage'; // ¡Importación de ReportesPage!

import useAuthSessionSync from '../hooks/useAuthSessionSync';

function AppContent() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    setIsAdmin(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    console.log("Login exitoso. Admin:", true);
  };

  const handleLogout = () => {
    console.log("Cierre de sesión manual. Eliminando token...");
    sessionStorage.removeItem('access_token');
    setIsAdmin(false);
  };

  useAuthSessionSync(isAdmin, handleLogout);

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!isAdmin && adminOnly) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <div className="app-container">
      <Header isAdmin={isAdmin} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/proyectos-turismo" element={<ProyectosTurismoComunitarioPage isAdmin={isAdmin} />} />
          <Route path="/proyectos/:idProyecto" element={<ProjectDetailPage />} />
          <Route path="/diplomados" element={<DiplomadosPage isAdmin={isAdmin} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

          {/* Rutas de Cursos */}
          <Route path="/cursos" element={<CursosPage isAdmin={isAdmin} />} />
          <Route path="/cursos/nuevo" element={<ProtectedRoute adminOnly><CursoForm /></ProtectedRoute>} />
          <Route path="/cursos/editar/:idCursoUrl" element={<ProtectedRoute adminOnly><CursoForm /></ProtectedRoute>} />
          
          {/* Ruta de Fotos (cuadrícula de municipios) */}
          <Route path="/fotos" element={<FotosPage />} />
          <Route path="/fotos/municipio/:municipioId" element={<MunicipioGalleryPage />} />
          
          {/* --- RUTA DE REPORTES CORREGIDA --- */}
          {/* Asegúrate de que esta ruta esté definida y apunte a tu componente ReportesPage */}
          <Route path="/reportes" element={<ProtectedRoute adminOnly><ReportesPage /></ProtectedRoute>} />
          {/* --- FIN RUTA DE REPORTES --- */}

          {/* Rutas protegidas para administradores */}
          <Route path="/proyectos/nuevo" element={<ProtectedRoute adminOnly><ProjectForm /></ProtectedRoute>} />
          <Route path="/proyectos/editar/:idProyectoUrl" element={<ProtectedRoute adminOnly><ProjectForm /></ProtectedRoute>} />
          <Route path="/diplomados/nuevo" element={<ProtectedRoute adminOnly><AddDiplomadoForm /></ProtectedRoute>} />
          
          <Route path="/comunidades/nuevo" element={<ProtectedRoute adminOnly><CommunityForm /></ProtectedRoute>} />

        </Routes>
      </main>
    </div>
  );
}

export default AppContent;
