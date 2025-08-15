// src/components/ProyectosTurismoComunitarioPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext'; // Importa el hook de notificación

import './ProyectosTurismoComunitarioPage.css';

// Recibe la prop isAdmin
function ProyectosTurismoComunitarioPage({ isAdmin }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification(); // Usa el hook de notificación

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

  // Define el porcentaje mínimo que debería tener un proyecto en cada fase
  const getPhaseTargetPercentage = (faseActual) => {
    if (faseActual < 1) return 0;
    if (faseActual >= 7) return 100;

    switch (faseActual) {
      case 1: return 1;
      case 2: return 26;
      case 3: return 51;
      case 4: return 76;
      case 5: return 82;
      case 6: return 88;
      default: return 0;
    }
  };

  // Calcula el porcentaje de avance basado solo en el tiempo transcurrido
  const calculateTimeBasedProgress = (fechaInicio, fechaFinAprox) => {
    if (!fechaInicio || !fechaFinAprox) return 0;

    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFinAprox);
    const currentDate = new Date();

    if (currentDate < startDate) {
      return 0;
    }
    if (currentDate > endDate) {
      return 100;
    }
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();

    if (totalDuration <= 0) {
      return 100;
    }

    return (elapsedDuration / totalDuration) * 100;
  };
  
  // Función principal para calcular el avance final y el color de la barra
  const calcularAvance = (fechaInicio, fechaFinAprox, faseActual) => {
    // Si la fase es 7, el avance es 100% inmediatamente, sin importar el tiempo.
    if (faseActual === 7) {
      return 100;
    }

    const timeBasedPercentage = calculateTimeBasedProgress(fechaInicio, fechaFinAprox);
    const phaseTargetPercentage = getPhaseTargetPercentage(faseActual);
    
    const endDate = new Date(fechaFinAprox);
    const currentDate = new Date();

    // Si el tiempo se acabó y no es fase 7, el porcentaje es el de la fase (y será rojo)
    if (currentDate > endDate && faseActual < 7) {
        return Math.min(100, Math.max(0, Math.round(phaseTargetPercentage)));
    }

    // El porcentaje que se muestra en la barra es el MÁXIMO entre:
    // 1. El avance basado en el tiempo.
    // 2. El porcentaje mínimo que la fase actual debería tener.
    // Esto asegura que la barra "salte" a la fase si se avanza manualmente,
    // y luego siga avanzando por tiempo desde ese punto.
    let finalPercentage = Math.max(timeBasedPercentage, phaseTargetPercentage);
    
    // Asegurar que el porcentaje final esté entre 0 y 100 y redondear
    return Math.min(100, Math.max(0, Math.round(finalPercentage)));
  };

  // --- FUNCIÓN MODIFICADA: getProgressColor con lógica de días de atraso ---
  const getProgressColor = (fechaInicio, fechaFinAprox, faseActual) => {
    if (faseActual === 7) {
      return '#28a745'; // Verde: Proyecto completado
    }
    
    const timeBasedPercentage = calculateTimeBasedProgress(fechaInicio, fechaFinAprox);
    const phaseTargetPercentage = getPhaseTargetPercentage(faseActual);
    
    const endDate = new Date(fechaFinAprox);
    const currentDate = new Date();

    // Si el tiempo se acabó y no es fase 7, el color es rojo
    if (currentDate > endDate && faseActual < 7) {
        return '#dc3545'; // Rojo: Tiempo agotado, no completado
    }

    // Calcular la diferencia en porcentaje entre el avance esperado por fase y el avance real por tiempo
    const percentageBehind = phaseTargetPercentage - timeBasedPercentage;

    // Convertir la diferencia de porcentaje a días de atraso
    const startDate = new Date(fechaInicio);
    const totalProjectDurationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    let daysBehind = 0;
    if (totalProjectDurationDays > 0 && percentageBehind > 0) {
        daysBehind = (percentageBehind / 100) * totalProjectDurationDays;
    }

    // Definir umbrales de días para los colores
    const YELLOW_DAYS_THRESHOLD = 1; // 1 día de atraso = amarillo
    const RED_DAYS_THRESHOLD = 5;    // 5 o más días de atraso = rojo
    
    if (daysBehind >= RED_DAYS_THRESHOLD) {
        return '#dc3545'; // Rojo: Muy atrasado
    } else if (daysBehind >= YELLOW_DAYS_THRESHOLD) {
        return '#ffc107'; // Amarillo: Ligeramente atrasado
    } else {
        return '#28a745'; // Verde: En tiempo o adelantado (incluye recién iniciados)
    }
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
                  style={{ 
                    width: `${calcularAvance(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual)}%`,
                    backgroundColor: getProgressColor(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual) // Color dinámico
                  }}
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
