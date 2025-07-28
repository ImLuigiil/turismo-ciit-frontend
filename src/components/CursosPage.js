// src/components/CursosPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext'; // Para notificaciones
import './CursosPage.css'; // Crearemos este CSS

function CursosPage({ isAdmin }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchCursos = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = 'http://localhost:3000/cursos';
      const response = await axios.get(API_URL);
      setCursos(response.data);
    } catch (err) {
      console.error("Error al obtener los cursos:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const handleViewCourse = (curso) => {
    if (curso.tipo === 'video' && curso.link) {
      window.open(curso.link, '_blank'); // Abrir enlace de video en nueva pestaña
    } else if (curso.tipo === 'pdf' && curso.link) {
      // Construir la URL completa para el PDF
      const fullLink = curso.link.startsWith('http') ? curso.link : `http://localhost:3000${curso.link}`;
      window.open(fullLink, '_blank'); // Abrir PDF en nueva pestaña
    } else {
      showNotification('No hay contenido disponible para este curso.', 'error');
    }
  };

  const handleAgregarNuevoCurso = () => {
    navigate('/cursos/nuevo');
  };

  const handleEditarCurso = (cursoId) => {
    navigate(`/cursos/editar/${cursoId}`);
  };

  const handleEliminarCurso = async (cursoId) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el curso con ID: ${cursoId}?`)) {
      try {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
          showNotification('No estás autenticado para eliminar cursos.', 'error');
          navigate('/login');
          return;
        }

        await axios.delete(`http://localhost:3000/cursos/${cursoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        showNotification(`Curso con ID ${cursoId} eliminado con éxito.`, 'success');
        fetchCursos(); // Recargar la lista
      } catch (err) {
        console.error(`Error al eliminar el curso con ID ${cursoId}:`, err);
        showNotification('Error al eliminar el curso.', 'error');
      }
    }
  };

  if (loading) {
    return <div className="cursos-loading">Cargando cursos...</div>;
  }

  if (error) {
    return <div className="cursos-error">Error al cargar los cursos: {error.message}</div>;
  }

  return (
    <div className="cursos-container">
      <h2>Cursos Disponibles</h2>

      {isAdmin && (
        <button className="add-new-curso-button" onClick={handleAgregarNuevoCurso}>
          Agregar Nuevo Curso
        </button>
      )}

      <div className="cursos-list">
        {cursos.length > 0 ? (
          cursos.map(curso => (
            <div key={curso.idCurso} className="curso-card">
              <h3 className="curso-card-title">{curso.nombre}</h3>
              <p className="curso-card-type">Tipo: {curso.tipo === 'video' ? 'Video' : 'PDF'}</p>
              <button
                className="curso-card-button"
                onClick={() => handleViewCourse(curso)}
              >
                Ver Contenido
              </button>
              {isAdmin && (
                <div className="admin-actions">
                  <button
                    className="admin-edit-button"
                    onClick={() => handleEditarCurso(curso.idCurso)}
                  >
                    Editar
                  </button>
                  <button
                    className="admin-delete-button"
                    onClick={() => handleEliminarCurso(curso.idCurso)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-cursos">No hay cursos registrados.</p>
        )}
      </div>
    </div>
  );
}

export default CursosPage;
