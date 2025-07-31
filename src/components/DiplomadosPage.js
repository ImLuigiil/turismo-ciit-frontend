// src/components/DiplomadosPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PdfViewer from './PdfViewer';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext'; // Para notificaciones

import './DiplomadosPage.css';

// Recibe la prop isAdmin
function DiplomadosPage({ isAdmin }) {
  const [diplomados, setDiplomados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification(); // Usa el hook de notificación

  // Función para obtener diplomados (refactorizada para recargar)
  const fetchDiplomados = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = `${process.env.REACT_APP_API_URL}/diplomados`;
      const response = await axios.get(API_URL);
      setDiplomados(response.data);
    } catch (err) {
      console.error("Error al obtener los diplomados:", err);
      setError(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiplomados();
  }, []);

  const handleViewPdfClick = (link) => {
    if (link) {
      const baseUrl = `${process.env.REACT_APP_API_URL}`;
      const fullLink = link.startsWith('http://') || link.startsWith('https://')
                       ? link
                       : `${baseUrl}${link}`;

      console.log('Intentando cargar PDF desde URL (final):', fullLink);
      setSelectedPdfUrl(fullLink);
    } else {
      showNotification('No hay enlace de PDF disponible para este diplomado.', 'error');
    }
  };

  const handleClosePdfViewer = () => {
    setSelectedPdfUrl(null);
  };

  const handleAgregarNuevoDiplomado = () => {
    navigate('/diplomados/nuevo');
  };

  const handleEliminarDiplomado = async (idDiplomado) => {
      if (window.confirm(`¿Estás seguro de que quieres eliminar el diplomado con ID: ${idDiplomado}?`)) {
          try {
              const token = sessionStorage.getItem('access_token');
              if (!token) {
                  showNotification('No estás autenticado. Por favor, inicia sesión.', 'error');
                  navigate('/login');
                  return;
              }

              await axios.delete(`${process.env.REACT_APP_API_URL}/diplomados/${idDiplomado}`, {
                  headers: { Authorization: `Bearer ${token}` }
              });

              showNotification(`Diplomado con ID ${idDiplomado} eliminado con éxito.`, 'success');
              fetchDiplomados(); // Recargar lista
          } catch (err) {
              console.error(`Error al eliminar el diplomado con ID ${idDiplomado}:`, err);
              showNotification('Error al eliminar el diplomado.', 'error');
          }
      }
  };


  if (loading) {
    return <div className="diplomados-loading">Cargando diplomados...</div>;
  }

  if (error) {
    return <div className="diplomados-error">Error al cargar los diplomados: {error.message}</div>;
  }

  return (
    <div className="diplomados-container">
      <h2>Diplomados</h2>

      {isAdmin && (
        <button className="add-new-diplomado-button" onClick={handleAgregarNuevoDiplomado}>
          Agregar Nuevo Diplomado
        </button>
      )}

      <div className="diplomados-list">
        {diplomados.length > 0 ? (
          diplomados.map(diplomado => (
            <div key={diplomado.idDiplomado} className="diplomado-card">
              <h3 className="diplomado-card-title">{diplomado.nombre}</h3>
              <button
                className="diplomado-card-button"
                onClick={() => handleViewPdfClick(diplomado.link)}
              >
                Ver / Descargar PDF
              </button>
              {diplomado.fechaSubida && (
                <p className="diplomado-card-date">Fecha de subida: {new Date(diplomado.fechaSubida).toLocaleDateString()}</p>
              )}
              {isAdmin && (
                  <div className="admin-actions">
                      <button 
                        className="admin-delete-button"
                        onClick={() => handleEliminarDiplomado(diplomado.idDiplomado)}
                      >
                          Eliminar
                      </button>
                  </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-diplomados">No hay diplomados registrados.</p>
        )}
      </div>

      {selectedPdfUrl && (
        <PdfViewer pdfUrl={selectedPdfUrl} onClose={handleClosePdfViewer} />
      )}
    </div>
  );
}

export default DiplomadosPage;
