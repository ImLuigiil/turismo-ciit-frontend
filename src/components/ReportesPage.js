// src/components/ReportesPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ReportesPage.css';

function ReportesPage() {
  const [proyectos, setProyectos] = useState([]);

  const chartRef = useRef(null);
    const [counts, setCounts] = useState({ green: 0, yellow: 0, red: 0, grey: 0 });



    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
            const total = counts.green + counts.yellow + counts.red + counts.grey;
            if (total === 0) return;

            let startAngle = 0;
            const drawSlice = (color, count) => {
                const sliceAngle = (count / total) * 2 * Math.PI;
                ctx.beginPath();
                ctx.moveTo(100, 100);
                ctx.arc(100, 100, 80, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                startAngle += sliceAngle;
            };

            drawSlice('#28a745', counts.green);
            drawSlice('#ffc107', counts.yellow);
            drawSlice('#dc3545', counts.red);
            drawSlice('#6c757d', counts.grey);
        }
    }, [counts]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchProyectos = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
          showNotification('No autorizado. Por favor, inicia sesión para ver los reportes.', 'error');
          navigate('/login');
          return;
        }
        const API_URL = `${process.env.REACT_APP_API_URL}/proyectos`;
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProyectos(response.data);
      } catch (err) {
        console.error("Error al obtener los proyectos para reportes:", err);
        setError("No se pudieron cargar los proyectos para generar reportes.");
        if (err.response && err.response.status === 401) {
          showNotification('Tu sesión ha expirado. Por favor, inicia sesión.', 'error');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProyectos();
  }, [navigate, showNotification]);

  const getPhaseTargetPercentage = (faseActual) => {
    if (faseActual < 1) return 0;
    if (faseActual >= 7) return 100;
    if (faseActual <= 3) return faseActual * 25;
    const percentagePerSubPhase = 25 / 4;
    return 75 + (faseActual - 3) * percentagePerSubPhase;
};

const calculateTimeBasedProgress = useCallback((fechaInicio, fechaFinAprox) => {
    if (!fechaInicio || !fechaFinAprox) return 0;
    // ... (Tu lógica de calculateTimeBasedProgress) ...
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFinAprox);
    const currentDate = new Date();
    if (currentDate < startDate) return 0;
    if (currentDate > endDate) return 100;
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    if (totalDuration <= 0) return 100;
    return (elapsedDuration / totalDuration) * 100;
}, []);

const getProgressColor = useCallback((fechaInicio, fechaFinAprox, faseActual) => {
    if (!fechaInicio || !fechaFinAprox || !faseActual || faseActual < 1) {
        return '#6c757d'; // Gris: Faltan datos para calcular
    }
    if (faseActual === 7) return '#28a745'; // Verde: Proyecto completado
    const currentDate = new Date();
    const endDate = new Date(fechaFinAprox);
    if (currentDate > endDate) return '#dc3545';
    const timeBasedPercentage = calculateTimeBasedProgress(fechaInicio, fechaFinAprox);
    const phaseTargetPercentage = getPhaseTargetPercentage(faseActual);
    const startDate = new Date(fechaInicio);
    const totalDurationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const percentageDifference = phaseTargetPercentage - timeBasedPercentage;
    const daysBehind = (percentageDifference / 100) * totalDurationDays;
    const YELLOW_DAYS_THRESHOLD = 4;
    const RED_DAYS_THRESHOLD = 5;
    if (daysBehind >= RED_DAYS_THRESHOLD) {
        return '#dc3545';
    } else if (daysBehind > 0 && daysBehind <= YELLOW_DAYS_THRESHOLD) {
        return '#ffc107';
    } else {
        return '#28a745';
    }
}, [calculateTimeBasedProgress]); 

    useEffect(() => {
        if (proyectos.length > 0) {
            let greenCount = 0;
            let yellowCount = 0;
            let redCount = 0;
            let greyCount = 0;
            proyectos.forEach(p => {
                const color = getProgressColor(p.fechaInicio, p.fechaFinAprox, p.faseActual);
                switch (color) {
                    case '#28a745': greenCount++; break;
                    case '#ffc107': yellowCount++; break;
                    case '#dc3545': redCount++; break;
                    default: greyCount++; break;
                }
            });
            setCounts({ green: greenCount, yellow: yellowCount, red: redCount, grey: greyCount });
        }
    }, [proyectos, getProgressColor]);


  const handleGenerateProjectReport = async (projectId, projectName) => {
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        showNotification('No estás autenticado para generar reportes.', 'error');
        navigate('/login');
        return;
      }

      showNotification(`Generando reporte PDF para "${projectName}"...`, 'info', 5000);

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/proyectos/${projectId}/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });


      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_proyecto_${projectName.replace(/\s/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification(`Reporte PDF para "${projectName}" generado y descargado con éxito!`, 'success');

    } catch (err) {
      console.error("Error al generar el reporte PDF:", err);
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401) {
          showNotification('No autorizado para generar reportes. Tu sesión ha expirado.', 'error');
          navigate('/login');
        } else if (err.response.data) {
          const reader = new FileReader();
          reader.onload = function() {
            try {
              const errorData = JSON.parse(reader.result);
              showNotification(`Error al generar reporte: ${errorData.message || 'Error desconocido'}`, 'error');
            } catch (parseError) {
              showNotification('Error al generar reporte. Formato de error inesperado.', 'error');
            }
          };
          reader.readAsText(err.response.data);
        }
      } else {
        showNotification('Ocurrió un error al generar el reporte PDF.', 'error');
      }
    }
  };


  const handleGenerateGeneralReport = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        showNotification('No estás autenticado para generar reportes.', 'error');
        navigate('/login');
        return;
      }

      showNotification('Generando reporte general de proyectos...', 'info', 5000);


      const response = await axios.get(`${process.env.REACT_APP_API_URL}/proyectos/report/general`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_general_proyectos_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('Reporte general de proyectos generado y descargado con éxito!', 'success');

    } catch (err) {
      console.error("Error al generar el reporte general PDF:", err);
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401) {
          showNotification('No autorizado para generar reportes. Tu sesión ha expirado.', 'error');
          navigate('/login');
        } else if (err.response.data) {
          const reader = new FileReader();
          reader.onload = function() {
            try {
              const errorData = JSON.parse(reader.result);
              showNotification(`Error al generar reporte general: ${errorData.message || 'Error desconocido'}`, 'error');
            } catch (parseError) {
              showNotification('Error al generar reporte general. Formato de error inesperado.', 'error');
            }
          };
          reader.readAsText(err.response.data);
        }
      } else {
        showNotification('Ocurrió un error al generar el reporte general PDF.', 'error');
      }
    }
  };


      if (loading) {
        return <div className="reportes-loading">Cargando opciones de reportes...</div>;
      }

      if (error) {
        return <div className="reportes-error">{error}</div>;
      }

      return (
        <div className="reportes-container">
          <h2>Generación de Reportes</h2>

          <div className="report-section">
            <h3>Reportes de Proyectos Individuales</h3>
            <p>Genera un reporte PDF detallado para cada proyecto, incluyendo su información, justificaciones de fase y fotos.</p>
            {proyectos.length > 0 ? (
              <div className="project-report-list">
                {proyectos.map(proyecto => (
                  <div key={proyecto.idProyecto} className="project-report-item">
                    <span>{proyecto.nombre}</span>
                    <button
                      onClick={() => handleGenerateProjectReport(proyecto.idProyecto, proyecto.nombre)}
                      className="generate-button"
                    >
                      Generar PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-proyectos-for-reports">No hay proyectos disponibles para generar reportes individuales.</p>
            )}
          </div>

          <div className="report-section">
            <h3>Reporte de Avance General de Proyectos</h3>
            <p>Un resumen del estado actual de todos los proyectos, incluyendo su fase, porcentaje de avance y estado (en tiempo, atrasado).</p>
            <button 
              onClick={handleGenerateGeneralReport} 
              className="generate-button"
              disabled={proyectos.length === 0}
            >
              Generar Reporte General
            </button>
          </div>

          <div className="report-section chart-container">
        <h3>Estado General de Proyectos</h3>
        <div className="pie-chart-wrapper">
            <canvas ref={chartRef} width="200" height="200"></canvas>
            <div className="chart-legend">
                <h4>Distribución de Proyectos</h4>
                <p><strong>Total de Proyectos:</strong> {proyectos.length}</p>
                <ul>
                    <li style={{ color: '#28a745' }}><strong>En Tiempo:</strong> {counts.green}</li>
                    <li style={{ color: '#ffc107' }}><strong>Atraso Leve:</strong> {counts.yellow}</li>
                    <li style={{ color: '#dc3545' }}><strong>Muy Atrasados:</strong> {counts.red}</li>
                    <li style={{ color: '#6c757d' }}><strong>Sin Fechas:</strong> {counts.grey}</li>
                </ul>
            </div>
        </div>
    </div>


        </div>
      );
    }

    export default ReportesPage;
