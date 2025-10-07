// src/components/ProyectosTurismoComunitarioPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ProyectosTurismoComunitarioPage.css';

// Funciones de utilidad (Se mantienen fuera del componente para consistencia)
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

    // Se asume el 75% para las primeras 3 fases y 25% para las últimas 4
    const timeForFirstThreePhases = totalDurationDays * 0.75;
    const daysPerEarlyPhase = timeForFirstThreePhases / 3; // 25% del total para c/u

    const timeForLastFourPhases = totalDurationDays * 0.25;
    const daysPerLatePhase = timeForLastFourPhases / 4; // El 25% restante dividido en 4

    const phaseEndDates = [];
    let cumulativeDays = 0;

    // Fases 1, 2, 3 (25% cada una del tiempo cronológico total)
    for (let i = 0; i < 3; i++) {
        cumulativeDays += daysPerEarlyPhase;
        const phaseEndDate = new Date(startDate);
        phaseEndDate.setDate(startDate.getDate() + cumulativeDays);
        phaseEndDates.push(phaseEndDate);
    }

    // Fases 4, 5, 6, 7 (6.25% cada una del tiempo cronológico total restante)
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

    // --- ESTADOS Y LÓGICA DE LA MODAL DE AVANCE DE FASE ---
    const [showConcludePhaseModal, setShowConcludePhaseModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null); 
    const [concludeJustificationText, setConcludeJustificationText] = useState('');
    const [concludeDocumentFile, setConcludeDocumentFile] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // --- FIN ESTADOS Y LÓGICA DE LA MODAL DE AVANCE DE FASE ---


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
        if (newProjectNotification) {
            try {
                const { name } = JSON.parse(newProjectNotification);
                showNotification(`Se ha subido un nuevo proyecto "${name}"`, 'success');
                localStorage.removeItem('newProjectNotification');
            } catch (e) {
                console.error("Error al parsear la notificación de nuevo proyecto:", e);
                localStorage.removeItem('newProjectNotification');
            }
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
        
        // Mapeo de porcentajes al inicio de cada fase (mínimo que debería tener)
        const getPhaseProgress = (fase) => {
            if (fase <= 1) return 0;
            // 25% por las primeras 3 fases, el 25% restante dividido en 4 (6.25% c/u)
            const progressMap = { 2: 25, 3: 50, 4: 75, 5: 81.25, 6: 87.5, 7: 93.75 };
            return progressMap[fase] || 0;
        };

        const timeBasedPercentage = calculateTimeBasedProgress(fechaInicio, fechaFinAprox);
        const phaseTargetPercentage = getPhaseProgress(faseActual);

        const endDate = new Date(fechaFinAprox);
        const currentDate = new Date();

        // Si el tiempo total ya se agotó y no está en fase 7, el avance es el máximo alcanzado por la fase
        if (currentDate > endDate && faseActual < 7) {
            return Math.min(100, Math.max(0, Math.round(phaseTargetPercentage)));
        }

        // El avance final es el máximo entre el avance cronológico y el avance de fase actual
        let finalPercentage = Math.max(timeBasedPercentage, phaseTargetPercentage);
        
        return Math.min(100, Math.max(0, Math.round(finalPercentage)));
    };

    const getProgressColor = (fechaInicio, fechaFinAprox, faseActual) => {
        if (!fechaInicio || !fechaFinAprox || !faseActual || faseActual < 1) {
            return '#6c757d'; // Gris: Faltan datos para calcular
        }

        if (faseActual === 7) {
            return '#28a745'; // Verde: Proyecto completado
        }

        const currentDate = new Date();
        const endDate = new Date(fechaFinAprox);

        // 1. Si el tiempo total ya se agotó (y no está en fase 7), es rojo
        if (currentDate > endDate) {
            return '#dc3545'; 
        }

        const schedule = getPhaseSchedule(fechaInicio, fechaFinAprox);
        
        // Si el schedule es inválido, devuelve color por defecto (gris)
        if (schedule.length === 0) {
            return '#6c757d'; 
        }

        // Obtiene la fecha de finalización cronológica esperada para la fase actual (índice 0 = Fase 1)
        const expectedEndDateForCurrentPhase = schedule[faseActual - 1];

        // 2. Determinar atraso basado en la fecha esperada de la fase actual
        const timeDifference = currentDate.getTime() - expectedEndDateForCurrentPhase.getTime();
        const daysBehind = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Días de retraso (positivo si está atrasado)

        if (daysBehind <= 0) {
            return '#28a745'; // Verde: En tiempo o adelantado
        }

        if (daysBehind >= 5) {
            return '#dc3545'; // Rojo: 5 o más días de retraso
        } 
        
        if (daysBehind >= 1 && daysBehind <= 4) {
            return '#ffc107'; // Amarillo: 1 a 4 días de retraso
        }

        return '#28a745'; // Por defecto verde si algo inesperado sucede
    };

    const truncateDescription = (description, maxLength) => {
        if (!description) return '';
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength) + '...';
    };

    const handleAgregarNuevo = () => {
        navigate('/proyectos/nuevo');
    };

    const handleEditarProyecto = (proyectoId) => {
        navigate(`/proyectos/editar/${proyectoId}`);
    };

    const handleEliminarProyecto = async (proyectoId) => {
        // --- ADVERTENCIA: Reemplazar con modal personalizada para producción ---
        if (!window.confirm(`¿Estás seguro de que quieres eliminar el proyecto con ID: ${proyectoId}?`)) {
            return;
        }
        // --- FIN ADVERTENCIA ---

        try {
            const token = sessionStorage.getItem('access_token');
            if (!token) {
                showNotification('No estás autenticado. Por favor, inicia sesión.', 'error');
                navigate('/login');
                return;
            }

            await axios.delete(`${process.env.REACT_APP_API_URL}/proyectos/${proyectoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showNotification(`Proyecto con ID ${proyectoId} eliminado con éxito.`, 'success');
            fetchProyectos();
        } catch (err) {
            console.error(`Error al eliminar el proyecto con ID ${proyectoId}:`, err);
            let errorMessage = 'Ocurrió un error al intentar eliminar el proyecto.';
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = Array.isArray(err.response.data.message) 
                    ? err.response.data.message.join(', ')
                    : err.response.data.message;
            }
            showNotification(`Error al eliminar: ${errorMessage}`, 'error');
        }
    };

    // --- Funciones para manejar la Modal de Avance de Fase ---
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
        if (file && file.type === 'application/pdf') {
            setConcludeDocumentFile(file);
            setModalError(null);
        } else {
            setConcludeDocumentFile(null);
            setModalError('Solo se permiten archivos PDF como documento de justificación.');
        }
    };

    const handleConcludePhaseCancel = () => {
        setShowConcludePhaseModal(false);
        setSelectedProject(null);
        setModalError(null);
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
    // --- Fin Funciones para manejar la Modal de Avance de Fase ---

    if (loading) {
        return <div className="proyectos-loading">Cargando proyectos de turismo comunitario...</div>;
    }

    if (error) {
        return <div className="proyectos-error">Error al cargar los proyectos: {error.message}</div>;
    }

    return (
        <div className="proyectos-page-container">
            <h2>Proyectos Red de Turismo Comunitario</h2>

            <div className="color-guide-container">
                <div className="color-guide-item">
                    <span className="color-box" style={{ backgroundColor: '#28a745' }}></span>
                    <p>En Tiempo (Avance según lo esperado)</p>
                </div>
                <div className="color-guide-item">
                    <span className="color-box" style={{ backgroundColor: '#ffc107' }}></span>
                    <p>Atraso Leve (1 a 4 días de retraso)</p>
                </div>
                <div className="color-guide-item">
                    <span className="color-box" style={{ backgroundColor: '#dc3545' }}></span>
                    <p>Muy Atrasado o Vencido (5 o más días de retraso)</p>
                </div>
                <div className="color-guide-item">
                    <span className="color-box" style={{ backgroundColor: '#6c757d' }}></span>
                    <p>Sin Fechas (Falta Fecha de Inicio/Fin)</p>
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
                                        {/* Botón Concluir Fase (Parpadea si es urgente) */}
                                        <button 
                                            className={`action-button conclude-button ${actionClass}`} 
                                            onClick={() => handleOpenConcludePhaseModal(proyecto)}
                                            disabled={proyecto.faseActual >= 7 || isSubmitting}
                                            title={proyecto.faseActual >= 7 ? "Proyecto completado" : "Avanzar a la siguiente fase"}
                                        >
                                            {proyecto.faseActual < 7 ? 'Concluir Fase' : 'Finalizado'}
                                        </button>
                                        
                                        <button
                                            className="action-button edit-button"
                                            onClick={() => handleEditarProyecto(proyecto.idProyecto)}
                                        >
                                            Editar
                                        </button>
                                        
                                        <button 
                                            className="action-button view-button" 
                                            onClick={() => navigate(`/proyectos/${proyecto.idProyecto}`)}
                                        >
                                            Ver Más
                                        </button>
                                        
                                        <button
                                            className="admin-delete-button"
                                            onClick={() => handleEliminarProyecto(proyecto.idProyecto)}
                                            title="Eliminar proyecto"
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

            {/* --- MODAL DE JUSTIFICACIÓN DE FASE (Añadido al final del componente) --- */}
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
                            {concludeDocumentFile && <p className="selected-file-name">Archivo seleccionado: {concludeDocumentFile.name}</p>}
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
            {/* --- FIN MODAL DE JUSTIFICACIÓN DE FASE --- */}
        </div>
    );
}

export default ProyectosTurismoComunitarioPage;
