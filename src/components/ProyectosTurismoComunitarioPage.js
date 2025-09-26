// src/components/ProyectosTurismoComunitarioPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ProyectosTurismoComunitarioPage.css';


const getPhaseSchedule = (fechaInicio, fechaFinAprox) => {
  if (!fechaInicio || !fechaFinAprox) {
    return [];
  }

  const startDate = new Date(fechaInicio);
  const endDate = new Date(fechaFinAprox);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
    return [];
  }
  
  const totalDurationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const timeForFirstThreePhases = totalDurationDays * 0.75;
  const daysPerEarlyPhase = timeForFirstThreePhases / 3; // 25% del total para c/u

  const timeForLastFourPhases = totalDurationDays * 0.25;
  const daysPerLatePhase = timeForLastFourPhases / 4; // El 25% restante dividido en 4

  const phaseEndDates = [];
  let cumulativeDays = 0;


  for (let i = 0; i < 3; i++) {
    cumulativeDays += daysPerEarlyPhase;
    const phaseEndDate = new Date(startDate);
    phaseEndDate.setDate(startDate.getDate() + cumulativeDays);
    phaseEndDates.push(phaseEndDate);
  }


  for (let i = 0; i < 4; i++) {
    cumulativeDays += daysPerLatePhase;
    const phaseEndDate = new Date(startDate);
    phaseEndDate.setDate(startDate.getDate() + Math.round(cumulativeDays));
    phaseEndDates.push(phaseEndDate);
  }


  return phaseEndDates;
};


function ProyectosTurismoComunitarioPage({ isAdmin }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

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
  
  const calcularAvance = (fechaInicio, fechaFinAprox, faseActual) => {
    if (faseActual === 7) {
      return 100;
    }
    
    const getPhaseProgress = (fase) => {
        if (fase <= 1) return 0;
        const progressMap = { 2: 25, 3: 50, 4: 75, 5: 81.25, 6: 87.5, 7: 100 };
        return progressMap[fase] || 0;
    };

    const timeBasedPercentage = calculateTimeBasedProgress(fechaInicio, fechaFinAprox);
    const phaseTargetPercentage = getPhaseProgress(faseActual);

    const endDate = new Date(fechaFinAprox);
    const currentDate = new Date();

    if (currentDate > endDate && faseActual < 7) {
        return Math.min(100, Math.max(0, Math.round(phaseTargetPercentage)));
    }

    let finalPercentage = Math.max(timeBasedPercentage, phaseTargetPercentage);
    
    return Math.min(100, Math.max(0, Math.round(finalPercentage)));
  };

  const getProgressColor = (fechaInicio, fechaFinAprox, faseActual) => {
    if (!fechaInicio || !fechaFinAprox || !faseActual || faseActual < 1) {
      return '#28a745'; 
    }

    if (faseActual === 7) {
      return '#28a745'; // Verde: Proyecto completado
    }

    const currentDate = new Date();
    const endDate = new Date(fechaFinAprox);

    if (currentDate > endDate) {
      return '#dc3545'; // Rojo: Tiempo total agotado, no completado
    }


    const schedule = getPhaseSchedule(fechaInicio, fechaFinAprox);
    
    if (schedule.length === 0) {
        return '#28a745'; 
    }

    const expectedEndDateForCurrentPhase = schedule[faseActual - 1];

    const timeDifference = currentDate.getTime() - expectedEndDateForCurrentPhase.getTime();
    const daysBehind = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (daysBehind <= 0) {
      return '#28a745'; // Verde: En tiempo o adelantado
    }


    if (daysBehind >= 5) {
      return '#dc3545'; // Rojo: 5 o más días de retraso
    } 
    
    if (daysBehind >= 1 && daysBehind <= 4) {
      return '#ffc107'; // Amarillo: 1 a 4 días de retraso
    }


    return '#28a745';
  };

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
                  className="progress-bar-container"
                >
                  <div
                    className="progress-bar"
                    style={{ 
                      width: `${calcularAvance(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual)}%`,
                      backgroundColor: getProgressColor(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual)
                    }}
                  ></div>
                </div>
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