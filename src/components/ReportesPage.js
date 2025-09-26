// src/components/ReportesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ReportesPage.css';

function ReportesPage() {
  const [proyectos, setProyectos] = useState([]);
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


        </div>
      );
    }

    export default ReportesPage;
