// src/components/ProyectosTurismoComunitarioPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ProyectosTurismoComunitarioPage.css';

// Recibe la prop isAdmin
function ProyectosTurismoComunitarioPage({ isAdmin }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Función para obtener proyectos
  const fetchProyectos = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = `${process.env.REACT_APP_API_URL}/proyectos`;
      const response = await axios.get(API_URL);
      setProyectos(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener los proyectos:", err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();

    const newProjectNotification = localStorage.getItem('newProjectNotification');
    console.log('ProyectosTurismoPage: Valor de newProjectNotification en localStorage:', newProjectNotification);
    if (newProjectNotification) {
      try {
        const { name } = JSON.parse(newProjectNotification);
        console.log('ProyectosTurismoPage: Disparando notificación para:', name);
        showNotification(`Se ha subido un nuevo proyecto "${name}"`, 'success');
        localStorage.removeItem('newProjectNotification');
        console.log('ProyectosTurismoPage: newProjectNotification eliminado de localStorage.');
      } catch (e) {
        console.error("Error al parsear la notificación de nuevo proyecto:", e);
        localStorage.removeItem('newProjectNotification');
      }
    } else {
      console.log('ProyectosTurismoPage: No se encontró newProjectNotification en localStorage.');
    }

  }, [showNotification]);

  // --- FUNCIÓN MODIFICADA: Obtener el porcentaje objetivo de la fase ---
  const getPhaseTargetPercentage = (faseActual) => {
    if (faseActual < 1) return 0;
    if (faseActual >= 7) return 100; // Si la fase es 7 o más, es 100%

    if (faseActual <= 3) {
      return faseActual * 25; // Fase 1=25%, 2=50%, 3=75%
    } else {
      // Fases 4 a 6 (inclusive)
      const percentagePerSubPhase = 25 / 4; // 6.25%
      return 75 + (faseActual - 3) * percentagePerSubPhase;
    }
  };
  // --- FIN FUNCIÓN MODIFICADA ---

  // --- FUNCIÓN MODIFICADA: calcularAvance basada en fechas y fase con límite estricto ---
  const calcularAvance = (fechaInicio, fechaFinAprox, faseActual) => {
    // Si la fase es 7, el avance es 100% inmediatamente, sin importar el tiempo.
    if (faseActual === 7) {
      return 100;
    }

    // Calcular el progreso basado en el tiempo transcurrido
    let timeBasedPercentage = 0;
    if (fechaInicio && fechaFinAprox) {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFinAprox);
      const currentDate = new Date();

      if (currentDate < startDate) {
        timeBasedPercentage = 0;
      } else if (currentDate > endDate) {
        timeBasedPercentage = 100;
      } else {
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsedDuration = currentDate.getTime() - startDate.getTime();
        if (totalDuration === 0) {
          timeBasedPercentage = 100;
        } else {
          timeBasedPercentage = (elapsedDuration / totalDuration) * 100;
        }
      }
    }

    // Obtener el porcentaje máximo permitido para la fase actual
    const phaseTargetPercentage = getPhaseTargetPercentage(faseActual);

    // El porcentaje final es el mínimo entre el progreso basado en tiempo
    // y el porcentaje objetivo de la fase actual. Esto asegura que el avance no "salte" fases.
    let finalPercentage = Math.min(timeBasedPercentage, phaseTargetPercentage);

    // Asegurar que el porcentaje final esté entre 0 y 100 y redondear
    return Math.min(100, Math.max(0, Math.round(finalPercentage)));
  };
  // --- FIN FUNCIÓN MODIFICADA ---

  const truncateDescription = (description, maxLength) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const handleAgregarNuevo = () => {
    navigate('/proyectos/nuevo');
    console.log("Redirigir a página para agregar nuevo proyecto");
  };

  const handleEditarProyecto = (proyectoId) => {
    navigate(`/proyectos/editar/${proyectoId}`);
    console.log(`Redirigir a página para editar el proyecto con ID: ${proyectoId}`);
  };

  const handleEliminarProyecto = async (proyectoId) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el proyecto con ID: ${proyectoId}?`)) {
      try {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
          alert('No estás autenticado. Por favor, inicia sesión.');
          navigate('/login');
          return;
        }

        await axios.delete(`${process.env.REACT_APP_API_URL}/proyectos/${proyectoId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert(`Proyecto con ID ${proyectoId} eliminado con éxito.`);
        fetchProyectos();
      } catch (err) {
        console.error(`Error al eliminar el proyecto con ID ${proyectoId}:`, err);
        if (err.response && err.response.status === 401) {
          alert('No autorizado. Tu sesión ha expirado o no tienes permisos.');
        } else if (err.response && err.response.data && err.response.data.message) {
          alert(`Error al eliminar: ${err.response.data.message}`);
        } else {
          alert('Ocurrió un error al intentar eliminar el proyecto.');
        }
      }
    }
  };

  if (loading) {
    return <div className="proyectos-loading">Cargando proyectos de turismo comunitario...</div>;
  }

  if (error) {
    return <div className="proyectos-error">Error al cargar los proyectos: {error.message}</div>;
  }

  return (
    <div className="proyectos-container">
      <h2>Proyectos Red de Turismo Comunitario</h2>

      {isAdmin && (
        <button className="add-new-project-button" onClick={handleAgregarNuevo}>
          Agregar Nuevo Proyecto
        </button>
      )}

      <div className="proyectos-grid">
        {proyectos.length > 0 ? (
          proyectos.map(proyecto => (
            <div key={proyecto.idProyecto} className="proyecto-card">
              {proyecto.imagenes && proyecto.imagenes.length > 0 ? (
                <div className="proyecto-card-image-container">
                  <img
                    src={`${process.env.REACT_APP_API_URL}${proyecto.imagenes[0].url}`}
                    alt={`Imagen de ${proyecto.nombre}`}
                    className="proyecto-card-image"
                  />
                </div>
              ) : (
                <div className="proyecto-card-image-container">
                  <img
                    src="https://placehold.co/300x180/e0e0e0/777?text=Sin+Imagen"
                    alt="Sin imagen"
                    className="proyecto-card-image"
                  />
                </div>
              )}
              <h3 className="proyecto-card-title">{proyecto.nombre}</h3>
              <p className="proyecto-card-description">
                {truncateDescription(proyecto.descripcion, 100)}
              </p>
              {proyecto.comunidad && (
                <p className="proyecto-card-community">Comunidad: {proyecto.comunidad.nombre}</p>
              )}
              <div className="proyecto-card-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${calcularAvance(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual)}%` }}
                ></div>
                <span className="progress-text">
                  Avance: {calcularAvance(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual)}%
                  {proyecto.faseActual && ` (Fase ${proyecto.faseActual})`}
                </span>
              </div>
              <button className="proyecto-card-button" onClick={() => navigate(`/proyectos/${proyecto.idProyecto}`)}>Ver Más</button>

              {isAdmin && (
                <div className="admin-actions">
                  <button
                    className="admin-edit-button"
                    onClick={() => handleEditarProyecto(proyecto.idProyecto)}
                  >
                    Editar
                  </button>
                  <button
                    className="admin-delete-button"
                    onClick={() => handleEliminarProyecto(proyecto.idProyecto)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-proyectos">No hay proyectos de turismo comunitario registrados.</p>
        )}
      </div>
    </div>
  );
}

export default ProyectosTurismoComunitarioPage;
