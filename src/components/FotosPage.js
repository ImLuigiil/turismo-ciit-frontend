// src/components/FotosPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FotosPage.css'; // Crearemos/actualizaremos este CSS

function FotosPage() {
  const [municipalitiesData, setMunicipalitiesData] = useState([]); // Agrupará { comunidadId: { nombre: '...', imagenes: [] } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectImagesGrouped = async () => {
      try {
        const API_URL = 'http://localhost:3000/proyectos'; // Endpoint para obtener todos los proyectos
        const response = await axios.get(API_URL);
        const projects = response.data;

        const grouped = {}; // Objeto para agrupar por comunidad/municipio

        projects.forEach(project => {
          if (project.comunidad && project.imagenes && project.imagenes.length > 0) {
            const comunidadId = project.comunidad.idComunidad;
            const comunidadNombre = project.comunidad.nombre;

            if (!grouped[comunidadId]) {
              // --- CORRECCIÓN CLAVE AQUÍ ---
              grouped[comunidadId] = { // ¡Eliminado 'com' antes de comunidadId!
                id: comunidadId,
                nombre: comunidadNombre,
                count: 0,
                firstImageUrl: '', // Para mostrar una miniatura representativa
              };
              // --- FIN CORRECCIÓN ---
            }
            grouped[comunidadId].count += project.imagenes.length;

            // Si aún no hay una imagen principal, toma la primera del proyecto
            if (!grouped[comunidadId].firstImageUrl) {
              grouped[comunidadId].firstImageUrl = `http://localhost:3000${project.imagenes[0].url}`;
            }
          }
        });
        
        // Convertir el objeto agrupado a un array para renderizar
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
    navigate(`/fotos/municipio/${municipioId}`); // Redirige a la nueva página de galería por municipio
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
            <h3 className="municipio-card-title">{municipio.nombre}</h3> {/* Nombre del municipio */}
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
