// src/components/FotosPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FotosPage.css'; 

function FotosPage() {
  const [municipalitiesData, setMunicipalitiesData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectImagesGrouped = async () => {
      try {
        const API_URL = `${process.env.REACT_APP_API_URL}/proyectos`;
        const response = await axios.get(API_URL);
        const projects = response.data;

        const grouped = {}; 

        projects.forEach(project => {
          if (project.comunidad && project.imagenes && project.imagenes.length > 0) {
            const comunidadId = project.comunidad.idComunidad;
            const comunidadNombre = project.comunidad.nombre;

            if (!grouped[comunidadId]) {
              grouped[comunidadId] = { 
                id: comunidadId,
                nombre: comunidadNombre,
                count: 0,
                firstImageUrl: '',
              };
            }
            grouped[comunidadId].count += project.imagenes.length;

            if (!grouped[comunidadId].firstImageUrl) {
              grouped[comunidadId].firstImageUrl = `${process.env.REACT_APP_API_URL}${project.imagenes[0].url}`;
            }
          }
        });
        
        setMunicipalitiesData(Object.values(grouped));
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener las imágenes de proyectos:", err);
        setError("No se pudieron cargar los datos de la galería.");
        setLoading(false);
      }
    };

    fetchProjectImagesGrouped();
  }, []);

  const handleViewGallery = (municipioId) => {
    navigate(`/fotos/municipio/${municipioId}`);
  };

  if (loading) {
    return <div className="fotos-loading">Cargando galería de fotos...</div>;
  }

  if (error) {
    return <div className="fotos-error">Error: {error.message}</div>;
  }

  return (
    <div className="fotos-container">
      <h2>Galería de Fotos por Municipio</h2>
      {municipalitiesData.length === 0 && <p className="no-fotos">No hay municipios con fotos disponibles.</p>}

      <div className="municipio-grid">
        {municipalitiesData.map(municipio => (
          <div key={municipio.id} className="municipio-card">
            {municipio.firstImageUrl ? (
              <div className="municipio-card-image-container">
                <img src={municipio.firstImageUrl} alt={`Foto de ${municipio.nombre}`} className="municipio-card-image" />
              </div>
            ) : (
              <div className="municipio-card-image-container no-image">
                <p>Sin imagen</p>
              </div>
            )}
            <h3 className="municipio-card-title">{municipio.nombre}</h3>
            <p className="municipio-card-count">{municipio.count} fotos</p>
            <button onClick={() => handleViewGallery(municipio.id)} className="municipio-card-button">
              Ver Galería
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FotosPage;
