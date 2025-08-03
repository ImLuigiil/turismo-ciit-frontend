// src/components/ProjectDetailPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ProjectDetailPage.css';

function ProjectDetailPage() {
  const { idProyecto } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [personasDirectorio, setPersonasDirectorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const CAROUSEL_ROTATION_SPEED = 5000; // 5 segundos

  const { showNotification } = useNotification();

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('en-US');
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const API_URL_BASE = `${process.env.REACT_APP_API_URL}`;

        const projectResponse = await axios.get(`${API_URL_BASE}/proyectos/${idProyecto}`);
        setProject(projectResponse.data);

        const personasResponse = await axios.get(`${API_URL_BASE}/personas-proyecto/by-project/${idProyecto}`);
        setPersonasDirectorio(personasResponse.data);

        setLoading(false);
      } catch (err) {
        console.error(`Error al obtener detalles del proyecto con ID ${idProyecto}:`, err);
        setError("No se pudieron cargar los detalles del proyecto.");
        setLoading(false);
      }
    };

    if (idProyecto) {
      fetchProjectDetails();
    } else {
      setError("ID de proyecto no proporcionado.");
      setLoading(false);
    }
  }, [idProyecto]);

  useEffect(() => {
    let intervalId;
    if (project && project.imagenes && project.imagenes.length > 1) {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % project.imagenes.length);
      }, CAROUSEL_ROTATION_SPEED);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [project, CAROUSEL_ROTATION_SPEED]);


  const goToNextImage = () => {
    if (project && project.imagenes && project.imagenes.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % project.imagenes.length);
    }
  };

  const goToPrevImage = () => {
    if (project && project.imagenes && project.imagenes.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex - 1 + project.imagenes.length) % project.imagenes.length
      );
    }
  };

  const calcularAvance = (faseActual) => {
    const totalFases = 7;
    if (faseActual < 1) return 0;
    if (faseActual > 7) return 100;

    if (faseActual <= 3) {
      return faseActual * 25;
    } else {
      const percentagePerSubPhase = 25 / 4;
      return 75 + (faseActual - 3) * percentagePerSubPhase;
    }
  };

  const handleGenerateReport = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        showNotification('No estás autenticado para generar reportes.', 'error');
        navigate('/login');
        return;
      }

      showNotification('Generando reporte PDF...', 'success', 5000);

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/proyectos/${idProyecto}/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_proyecto_${project.idProyecto}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('Reporte PDF generado y descargado con éxito!', 'success');

    } catch (err) {
      console.error("Error al generar el reporte PDF:", err);
      if (err.response && err.response.status === 401) {
        showNotification('No autorizado para generar reportes. Tu sesión ha expirado.', 'error');
        navigate('/login');
      } else if (err.response && err.response.data) {
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
      } else {
        showNotification('Ocurrió un error al generar el reporte PDF.', 'error');
      }
    }
  };

  if (loading) {
    return <div className="project-detail-loading">Cargando detalles del proyecto...</div>;
  }

  if (error) {
    return <div className="project-detail-error">{error}</div>;
  }

  if (!project) {
    return <div className="project-detail-error">Proyecto no encontrado.</div>;
  }

  const displayImageUrl = project.imagenes && project.imagenes.length > 0
    ? `${process.env.REACT_APP_API_URL}${project.imagenes[currentImageIndex].url}`
    : 'https://placehold.co/600x300/e0e0e0/777?text=Sin+Imagen';


  return (
    <div className="project-detail-container">
      <button onClick={() => navigate('/proyectos-turismo')} className="back-button">
        ← Volver a Proyectos
      </button>

      <h2>"{project.nombre}"</h2>

      <div className="project-detail-content">
        <div className="project-detail-sidebar">
          <p><strong>Estado Actual:</strong> Activo</p>
          <p><strong>Porcentaje:</strong> {calcularAvance(project.fechaInicio, project.fechaFinAprox, project.faseActual)}%</p>
          <p><strong>Avance:</strong> Fase {project.faseActual}</p>
          
          <div className="sidebar-progress-bar-container">
            <div
              className="sidebar-progress-bar"
              style={{ width: `${calcularAvance(project.fechaInicio, project.fechaFinAprox, project.faseActual)}%` }}
            ></div>
          </div>

          <h3>Personas del Directorio:</h3>
          {personasDirectorio.length > 0 ? (
            <ul className="directorio-personas-list">
              {personasDirectorio.map(persona => (
                <li key={persona.idPersonaProyecto}>
                  <strong>
                    {persona.apellidoPaterno} {persona.apellidoMaterno} {persona.nombre}
                  </strong>
                  {persona.rolEnProyecto && ` (${persona.rolEnProyecto})`}
                  {persona.contacto && ` - ${persona.contacto}`}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay personas registradas para este proyecto.</p>
          )}

          {project.comunidad && <p><strong>Comunidad:</strong> {project.comunidad.nombre}</p>}
          
          {project.poblacionBeneficiada !== null && project.poblacionBeneficiada !== undefined && (
            <p><strong>Población Beneficiada:</strong> {formatNumber(project.poblacionBeneficiada)}</p>
          )}

          {project.fechaInicio && <p><strong>Fecha Inicio:</strong> {new Date(project.fechaInicio).toLocaleDateString()}</p>}
          {project.fechaFinAprox && <p><strong>Fecha Fin Aprox:</strong> {new Date(project.fechaFinAprox).toLocaleDateString()}</p>}

          <button onClick={handleGenerateReport} className="generate-report-button">
            Generar Reporte PDF
          </button>
        </div>

        <div className="project-main-info">
          <div className="project-image-gallery-container">
            <img
              src={displayImageUrl}
              alt={`Imagen del proyecto ${project.nombre}`}
              className="project-main-image-full"
            />
            {project.imagenes && project.imagenes.length > 1 && (
              <div className="gallery-navigation">
                <button onClick={goToPrevImage} className="gallery-nav-button">←</button>
                <button onClick={goToNextImage} className="gallery-nav-button">→</button>
              </div>
            )}
            {project.imagenes && project.imagenes.length > 0 && (
              <div className="gallery-thumbnails">
                {project.imagenes.map((img, index) => (
                  <img
                    key={img.idProyectoImagen}
                    src={`${process.env.REACT_APP_API_URL}${img.url}`}
                    alt={`Thumbnail ${index}`}
                    className={`gallery-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="project-main-description">{project.descripcion}</p>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
