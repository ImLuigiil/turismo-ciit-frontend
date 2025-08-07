    // src/components/MunicipioGalleryPage.js
    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import { useParams, useNavigate } from 'react-router-dom';
    import './MunicipioGalleryPage.css'; 

    function MunicipioGalleryPage() {
      const { municipioId } = useParams(); 
      const navigate = useNavigate();
      const [municipioName, setMunicipioName] = useState('');
      const [allMunicipioImages, setAllMunicipioImages] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      const [currentImageIndex, setCurrentImageIndex] = useState(0);
      const CAROUSEL_ROTATION_SPEED = 5000;

      useEffect(() => {
        const fetchMunicipioImages = async () => {
          try {
            const API_URL_PROYECTOS = `${process.env.REACT_APP_API_URL}/proyectos`;
            const projectsResponse = await axios.get(API_URL_PROYECTOS);
            const projects = projectsResponse.data;

            let foundMunicipioName = '';
            const imagesForThisMunicipio = [];

            projects.forEach(project => {
              if (project.comunidad && String(project.comunidad.idComunidad) === municipioId) {
                foundMunicipioName = project.comunidad.nombre; 
                if (project.imagenes && project.imagenes.length > 0) {
                  project.imagenes.forEach(img => {
                    imagesForThisMunicipio.push({
                      id: img.idProyectoImagen,
                      url: img.url,
                      projectName: project.nombre, 
                    });
                  });
                }
              }
            });

            if (!foundMunicipioName) {
              setError("Municipio no encontrado o sin proyectos con fotos.");
            }
            setMunicipioName(foundMunicipioName);
            setAllMunicipioImages(imagesForThisMunicipio);
            setLoading(false);

          } catch (err) {
            console.error(`Error al obtener imágenes para el municipio ${municipioId}:`, err);
            setError("No se pudieron cargar las imágenes del municipio.");
            setLoading(false);
          }
        };

        if (municipioId) {
          fetchMunicipioImages();
        } else {
          setError("ID de municipio no proporcionado.");
          setLoading(false);
        }
      }, [municipioId]);

      useEffect(() => {
        let intervalId;
        if (allMunicipioImages.length > 1) {
          intervalId = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allMunicipioImages.length);
          }, CAROUSEL_ROTATION_SPEED);
        }

        return () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
        };
      }, [allMunicipioImages, CAROUSEL_ROTATION_SPEED]);

      const goToNextImage = () => {
        if (allMunicipioImages.length > 0) {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allMunicipioImages.length);
        }
      };

      const goToPrevImage = () => {
        if (allMunicipioImages.length > 0) {
          setCurrentImageIndex((prevIndex) =>
            (prevIndex - 1 + allMunicipioImages.length) % allMunicipioImages.length
          );
        }
      };

      if (loading) {
        return <div className="gallery-loading">Cargando galería de {municipioId}...</div>;
      }

      if (error) {
        return <div className="gallery-error">{error}</div>;
      }

      const displayImageUrl = allMunicipioImages.length > 0
        ? `${process.env.REACT_APP_API_URL}${allMunicipioImages[currentImageIndex].url}`
        : 'https://placehold.co/800x450/e0e0e0/777?text=Sin+Imágenes+para+este+Municipio';

      return (
        <div className="municipio-gallery-container">
          <button onClick={() => navigate('/fotos')} className="back-to-fotos-button">
            ← Volver a Galería por Municipio
          </button>
          
          <h2>Fotos de {municipioName || 'Municipio Desconocido'}</h2>

          {allMunicipioImages.length === 0 ? (
            <p className="no-images-for-municipio">No hay imágenes disponibles para este municipio.</p>
          ) : (
            <div className="gallery-content">
              <div className="main-gallery-display">
                <img src={displayImageUrl} alt={`Imagen de ${municipioName}`} className="main-gallery-image" />
                {allMunicipioImages.length > 1 && (
                  <div className="gallery-navigation">
                    <button onClick={goToPrevImage} className="gallery-nav-button">←</button>
                    <button onClick={goToNextImage} className="gallery-nav-button">→</button>
                  </div>
                )}
                {allMunicipioImages[currentImageIndex]?.projectName && (
                    <p className="current-image-project-name">
                        Proyecto: {allMunicipioImages[currentImageIndex].projectName}
                    </p>
                )}
              </div>
              <div className="gallery-thumbnails-container">
                {allMunicipioImages.map((img, index) => (
                  <img
                    key={img.id}
                    src={`${process.env.REACT_APP_API_URL}${img.url}`}
                    alt={`Thumbnail ${index}`}
                    className={`gallery-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    export default MunicipioGalleryPage;
    