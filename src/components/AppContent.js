    // src/components/AppContent.js
    import React, { useState, useEffect } from 'react';
    import { Routes, Route, Navigate } from 'react-router-dom';

    import Header from './Header';
    import HomePage from './HomePage';
    import ProyectosTurismoComunitarioPage from './ProyectosTurismoComunitarioPage';
    import ProjectDetailPage from './ProjectDetailPage';
    import ProjectForm from './ProjectForm';
    import LoginPage from './LoginPage';
    import DiplomadosPage from './DiplomadosPage';
    import AddDiplomadoForm from './AddDiplomadoForm';
    import CursoForm from './CursoForm';
    import CursosPage from './CursosPage';
    import FotosPage from './FotosPage';
    import MunicipioGalleryPage from './MunicipioGalleryPage';

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

              <Route path="/cursos" element={<CursosPage isAdmin={isAdmin} />} />
              <Route path="/cursos/nuevo" element={<ProtectedRoute adminOnly><CursoForm /></ProtectedRoute>} />
              <Route path="/cursos/editar/:idCursoUrl" element={<ProtectedRoute adminOnly><CursoForm /></ProtectedRoute>} />
              
              <Route path="/fotos" element={<FotosPage />} />
              <Route path="/fotos/municipio/:municipioId" element={<MunicipioGalleryPage />} />

              <Route path="/proyectos/nuevo" element={<ProtectedRoute adminOnly><ProjectForm /></ProtectedRoute>} />
              <Route path="/proyectos/editar/:idProyectoUrl" element={<ProtectedRoute adminOnly><ProjectForm /></ProtectedRoute>} />
              <Route path="/diplomados/nuevo" element={<ProtectedRoute adminOnly><AddDiplomadoForm /></ProtectedRoute>} />
              

            </Routes>
          </main>
        </div>
      );
    }

    export default AppContent;
    