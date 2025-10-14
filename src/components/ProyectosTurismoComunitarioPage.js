// src/components/ProyectosTurismoComunitarioPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { Pie } from 'react-chartjs-2';

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

  const [showConcludePhaseModal, setShowConcludePhaseModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null); 
    const [concludeJustificationText, setConcludeJustificationText] = useState('');
    const [concludeDocumentFile, setConcludeDocumentFile] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [concludeDocumentPreviewUrl, setConcludeDocumentPreviewUrl] = useState('');
    const MAX_FILE_SIZE_MB = 10;

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
        // --- CÓDIGO AÑADIDO: Obtención del proyecto para la notificación ---
        const proyectoToDelete = proyectos.find(p => p.idProyecto === proyectoId);
        if (proyectoToDelete && proyectoToDelete.faseActual > 1) {
            showNotification(`No puedes eliminar el proyecto "${proyectoToDelete.nombre}". Solo los proyectos en Fase 1 pueden ser borrados.`, 'error');
            return;
        }
        // --- FIN CÓDIGO AÑADIDO ---
        
        // **ADVERTENCIA: Uso temporal de window.confirm() para desarrollo.**
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el proyecto con ID: ${proyectoId}?`)) {
            return;
        }

        try {
            // --- CÓDIGO CLAVE AÑADIDO/MODIFICADO: Obtención del token ---
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                showNotification('No estás autenticado. Por favor, inicia sesión.', 'error');
                navigate('/login');
                return;
            }
            // --- FIN CÓDIGO CLAVE AÑADIDO/MODIFICADO ---

            await axios.delete(`${process.env.REACT_APP_API_URL}/proyectos/${proyectoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showNotification(`Proyecto con ID ${proyectoId} eliminado con éxito.`, 'success');
            fetchProyectos();
        } catch (err) {
            console.error(`Error al eliminar el proyecto con ID ${proyectoId}:`, err);
            let errorMessage = 'Ocurrió un error al intentar eliminar el proyecto.';
            
            // Captura el error específico de validación del backend (Fase > 1)
            if (err.response && err.response.status === 400 && err.response.data.message) {
                errorMessage = err.response.data.message;
            } else if (err.response && err.response.data && err.response.data.message) {
                 errorMessage = Array.isArray(err.response.data.message) 
                    ? err.response.data.message.join(', ')
                    : err.response.data.message;
            }

            showNotification(`Error al eliminar: ${errorMessage}`, 'error');
        }
    };

      const handleOpenConcludePhaseModal = (proyecto) => {
        if (proyecto.faseActual >= 7) {
            showNotification('El proyecto ya ha alcanzado la fase final (7).', 'info');
            return;
        }
        setSelectedProject(proyecto);
        setConcludeJustificationText('');
        setConcludeDocumentFile(null);
        setModalError(null);
        setShowConcludePhaseModal(true);
    };

    const handleConcludeDocumentChange = (e) => {
        const file = e.target.files[0];
        
        // --- CÓDIGO MODIFICADO: Validación y Creación de URL de previsualización ---
        if (concludeDocumentPreviewUrl) {
            URL.revokeObjectURL(concludeDocumentPreviewUrl);
        }

        if (file) {
            // Validación de tipo de archivo
            if (file.type !== 'application/pdf') {
                setConcludeDocumentFile(null);
                setConcludeDocumentPreviewUrl('');
                setError('Solo se permiten archivos PDF como documento de justificación.');
                return;
            }

            // Validación de tamaño de archivo (10MB)
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                setConcludeDocumentFile(null);
                setConcludeDocumentPreviewUrl('');
                setError(`El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE_MB}MB.`);
                return;
            }

            // Si pasa las validaciones, crea una URL para previsualización
            setConcludeDocumentFile(file);
            setConcludeDocumentPreviewUrl(URL.createObjectURL(file));
            setError(null);
        } else {
            setConcludeDocumentFile(null);
            setConcludeDocumentPreviewUrl('');
        }
        // --- FIN CÓDIGO MODIFICADO ---
    };

    const handleConcludePhaseCancel = () => {
        setShowConcludePhaseModal(false);
        setConcludeJustificationText('');
        setConcludeDocumentFile(null);
        setError(null);
        // --- CÓDIGO AÑADIDO: Limpieza de la URL de previsualización ---
        if (concludeDocumentPreviewUrl) {
            URL.revokeObjectURL(concludeDocumentPreviewUrl);
            setConcludeDocumentPreviewUrl('');
        }
        // --- FIN CÓDIGO AÑADIDO ---
    };

    const getProjectStatusCounts = () => {
        const counts = {
            enTiempo: 0,
            ligeramenteAtrasado: 0,
            muyAtrasado: 0,
            completado: 0, // Opcional, pero útil
        };

        proyectos.forEach(proyecto => {
            if (proyecto.faseActual >= 7) {
                counts.completado++;
                return;
            }

            const color = getProgressColor(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual);
            
            if (color === '#28a745') {
                counts.enTiempo++;
            } else if (color === '#ffc107') {
                counts.ligeramenteAtrasado++;
            } else if (color === '#dc3545') {
                counts.muyAtrasado++;
            }
        });

        return counts;
    };
    
    const statusCounts = getProjectStatusCounts();

    const pieChartData = {
        labels: [
            `En Tiempo (${statusCounts.enTiempo})`, 
            `Ligeramente Atrasado (${statusCounts.ligeramenteAtrasado})`, 
            `Muy Atrasado (${statusCounts.muyAtrasado})`,
            `Completado (${statusCounts.completado})`
        ],
        datasets: [
            {
                data: [
                    statusCounts.enTiempo,
                    statusCounts.ligeramenteAtrasado,
                    statusCounts.muyAtrasado,
                    statusCounts.completado
                ],
                backgroundColor: [
                    '#28a745', 
                    '#ffc107', 
                    '#dc3545',
                    '#007bff'
                ],
                borderColor: [
                    '#ffffff',
                    '#ffffff',
                    '#ffffff',
                    '#ffffff'
                ],
                borderWidth: 1,
            },
        ],
    };

    const handleConcludePhaseSubmit = async () => {
        if (!selectedProject) return;

        if (!concludeJustificationText.trim()) {
            setModalError('La justificación es obligatoria para avanzar de fase.');
            return;
        }
        if (!concludeDocumentFile) {
            setModalError('Se requiere un documento PDF que avale el cambio de fase.');
            return;
        }

        setIsSubmitting(true);
        setModalError(null);

        const token = sessionStorage.getItem('access_token');
        if (!token) {
            setModalError('No autorizado. Por favor, inicia sesión.');
            setIsSubmitting(false);
            navigate('/login');
            return;
        }

        const formData = new FormData();
        formData.append('justificacion', concludeJustificationText);
        formData.append('documento', concludeDocumentFile);

        try {
            const API_URL = `${process.env.REACT_APP_API_URL}/proyectos/${selectedProject.idProyecto}/concluir-fase`;
            const response = await axios.patch(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            // Actualizar la lista de proyectos en el frontend (sin recargar todo)
            setProyectos(prevProyectos => prevProyectos.map(p => 
                p.idProyecto === selectedProject.idProyecto 
                    ? { 
                        ...p, 
                        faseActual: response.data.faseActual, 
                        justificacionFase: response.data.justificacionFase 
                    } 
                    : p
            ));
            
            showNotification(`Fase del proyecto "${selectedProject.nombre}" avanzada a Fase ${response.data.faseActual}!`, 'success');

            handleConcludePhaseCancel(); // Cierra la modal
            
        } catch (err) {
            setIsSubmitting(false);
            let errorMessage = 'Error al avanzar de fase. Intenta de nuevo.';
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = Array.isArray(err.response.data.message) 
                    ? err.response.data.message.join(', ')
                    : err.response.data.message;
            }
            setModalError(errorMessage);
            console.error('Error al avanzar de fase:', err.response || err);
        } finally {
            setIsSubmitting(false);
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

      <div className="color-guide-container">
        <div className="color-guide-item">
            <span className="color-box" style={{ backgroundColor: '#28a745' }}></span>
            <p>En Tiempo (Avance según lo esperado)</p>
        </div>
        <div className="color-guide-item">
            <span className="color-box" style={{ backgroundColor: '#ffc107' }}></span>
            <p>Ligeramente Atrasado (1 a 4 días de retraso)</p>
        </div>
        <div className="color-guide-item">
            <span className="color-box" style={{ backgroundColor: '#dc3545' }}></span>
            <p>Muy Atrasado(5 o más días de retraso)</p>
        </div>
    </div>

      {isAdmin && (
        <button className="add-new-project-button" onClick={handleAgregarNuevo}>
          Agregar Nuevo Proyecto
        </button>
      )}

       <div className="proyectos-grid">
                {proyectos.length > 0 ? (
                    proyectos.map(proyecto => {
                        const avance = calcularAvance(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual);
                        const color = getProgressColor(proyecto.fechaInicio, proyecto.fechaFinAprox, proyecto.faseActual);
                        
                        // Lógica para la clase de parpadeo (urgent-action)
                        const actionClass = (color === '#ffc107' || color === '#dc3545') && proyecto.faseActual < 7 ? 'urgent-action' : '';

                        return (
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
                                                width: `${avance}%`,
                                                backgroundColor: color
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        Avance: {avance}%
                                        {proyecto.faseActual && ` (Fase ${proyecto.faseActual})`}
                                    </span>
                                </div>
                                
                                
                                
                                <button className="proyecto-card-button" onClick={() => navigate(`/proyectos/${proyecto.idProyecto}`)}>Ver Más</button>

                                {isAdmin && (
                                    <div className="card-actions">
                                        {/* Botón Concluir Fase */}
                                        <button 
                                            className={`action-button conclude-button ${actionClass}`} 
                                            onClick={() => handleOpenConcludePhaseModal(proyecto)}
                                            disabled={proyecto.faseActual >= 7 || isSubmitting}
                                            title={proyecto.faseActual >= 7 ? "Proyecto completado" : "Avanzar a la siguiente fase"}
                                        >
                                            {proyecto.faseActual < 7 ? 'Concluir Fase' : 'Finalizado'}
                                        </button>

                                        <button
                                            className="action-button admin-edit-button"
                                            onClick={() => handleEditarProyecto(proyecto.idProyecto)}
                                            // --- CÓDIGO CLAVE AÑADIDO ---
                                            title={proyecto.faseActual > 1 ? "No se puede editar un proyecto finalizado" : (proyecto.faseActual === 7 ? "Editar Proyecto" : "Editar proyecto")}
                                            disabled={proyecto.faseActual >= 7}
                                            // --- FIN CÓDIGO CLAVE AÑADIDO ---
                                        >
                                            Editar
                                        </button>
                                        
                                        {/* Botón Eliminar (Mantendremos admin-delete-button para un color distinto) */}
                                        <button
                                            className="action-button admin-delete-button"
                                            onClick={() => handleEliminarProyecto(proyecto.idProyecto)}
                                            title={proyecto.faseActual > 1 ? "No se puede eliminar: ya inició la Fase 2" : (proyecto.faseActual === 7 ? "Proyecto finalizado" : "Eliminar proyecto")}
                                            // --- CÓDIGO CLAVE MODIFICADO ---
                                            disabled={proyecto.faseActual > 1 || proyecto.faseActual >= 7}
                                            
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="no-proyectos">No hay proyectos de turismo comunitario registrados.</p>
                )}
            </div>
             {showConcludePhaseModal && selectedProject && (
                <div className="justification-modal-overlay">
                    <div className="justification-modal-content">
                        <h3>Concluir Fase {selectedProject.faseActual} a Fase {selectedProject.faseActual + 1}</h3>
                        <p>Proyecto: **{selectedProject.nombre}**</p>
                        <p>Para avanzar, explique los motivos y suba el documento de respaldo (PDF).</p>

                        <div className="form-group">
                            <label htmlFor="concludeJustification">Justificación (Obligatoria):</label>
                            <textarea
                                id="concludeJustification"
                                value={concludeJustificationText}
                                onChange={(e) => setConcludeJustificationText(e.target.value)}
                                placeholder="Escriba aquí la justificación..."
                                rows="4"
                                required
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="concludeDocument">Documento de Respaldo (PDF):</label>
                            <input
                                type="file"
                                id="concludeDocument"
                                accept=".pdf"
                                onChange={handleConcludeDocumentChange}
                                required
                            />
                            {/* --- CÓDIGO MODIFICADO: Muestra info de archivo subido --- */}
                            <p className="image-specs-text">
                                Formato soportado: PDF. Tamaño máximo: {MAX_FILE_SIZE_MB}MB.
                            </p>
                            {concludeDocumentFile && (
                                <p className="selected-file-name">
                                    Archivo seleccionado: 
                                    <a href={concludeDocumentPreviewUrl} target="_blank" rel="noopener noreferrer">
                                        {concludeDocumentFile.name}
                                    </a>
                                </p>
                            )}
                            {/* --- FIN CÓDIGO MODIFICADO --- */}
                        </div>
                        
                        {modalError && <p className="error-message">{modalError}</p>}

                        <div className="justification-warning">
                            <p>⚠️ Una vez confirmado el avance, **no se podrá retroceder** a una fase anterior.</p>
                        </div>

                        <div className="modal-buttons">
                            <button onClick={handleConcludePhaseSubmit} className="submit-button" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Confirmar Avance'}
                            </button>
                            <button onClick={handleConcludePhaseCancel} className="cancel-button" disabled={isSubmitting}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {proyectos.length > 0 && (
                    <div className="proyectos-chart-container">
                        <h3>Estado de Proyectos en Progreso</h3>
                        <Pie 
                            data={pieChartData}
                            options={{ 
                                responsive: true, 
                                plugins: {
                                    legend: {
                                        position: 'top',
                                    },
                                    title: {
                                        display: true,
                                        text: 'Distribución de Proyectos por Estado'
                                    }
                                }
                            }}
                        />
                    </div>
                )}

    </div>
  );
}

export default ProyectosTurismoComunitarioPage;