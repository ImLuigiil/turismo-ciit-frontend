// src/components/ProjectForm.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// --- CORRECCIÓN: Eliminar 'Link' de la importación ---
import { useNavigate, useParams } from 'react-router-dom';
// --- FIN CORRECCIÓN ---
import { useNotification } from '../contexts/NotificationContext';

import './ProjectForm.css';

function ProjectForm() {
  const { idProyectoUrl } = useParams();
  const isEditing = !!idProyectoUrl;

  const [idProyecto, setIdProyecto] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [listaComunidades, setListaComunidades] = useState([]);
  const [filteredComunidades, setFilteredComunidades] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [noCapitulos, setNoCapitulos] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinAprox, setFechaFinAprox] = useState('');
  const [faseActual, setFaseActual] = useState('1');

  const [originalFaseActual, setOriginalFaseActual] = useState('');
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justificationText, setJustificationText] = useState('');

  const [personasDirectorio, setPersonasDirectorio] = useState([]);

  const [nombreCambiosCount, setNombreCambiosCount] = useState(0);
  const MAX_NAME_CHANGES = 3;

  const [poblacionBeneficiada, setPoblacionBeneficiada] = useState('');

  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDeleteIds, setImagesToDeleteIds] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fases = Array.from({ length: 7 }, (_, i) => i + 1);

    // --- CORRECCIÓN EN LA FUNCIÓN: Formatear número con comas ---
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '';
    // Usamos toLocaleString para manejar el formato de comas correctamente.
    // El 'undefined' como primer argumento usa la configuración regional del navegador.
    return Number(num).toLocaleString('en-US'); 
  };

  // --- CORRECCIÓN EN LA FUNCIÓN: Limpiar y validar el input de población ---
  const handlePoblacionChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, ''); // Elimina las comas para la validación

    // Solo permite dígitos y limita la longitud a 9
    if (rawValue.length <= 9 && /^\d*$/.test(rawValue)) {
      setPoblacionBeneficiada(rawValue);
      setError(null);
    } else if (rawValue.length > 9) {
      setError('La población beneficiada no puede exceder las 9 cifras.');
    } else if (!/^\d*$/.test(rawValue)) {
        setError('Solo se permiten dígitos numéricos.');
    }
  };
  // --- FIN CORRECCIÓN ---

  useEffect(() => {
    const fetchComunidades = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/comunidades`);
        setListaComunidades(response.data);
        setFilteredComunidades(response.data);
      } catch (err) {
        console.error("Error al cargar la lista de comunidades:", err);
        setError("No se pudieron cargar las comunidades.");
      }
    };
    fetchComunidades();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredComunidades(listaComunidades);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = listaComunidades.filter(comunidad =>
        comunidad.nombre.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredComunidades(filtered);
    }
  }, [searchTerm, listaComunidades]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  useEffect(() => {
    if (isEditing) {
      setFormLoading(true);
      const fetchProjectData = async () => {
        try {
          const API_URL_BASE = `${process.env.REACT_APP_API_URL}/proyectos`;
          const response = await axios.get(`${API_URL_BASE}/${idProyectoUrl}`);
          const project = response.data;

          setIdProyecto(project.idProyecto);
          setNombre(project.nombre);
          setDescripcion(project.descripcion || '');
          if (project.comunidad) {
            setSearchTerm(project.comunidad.nombre);
            setSelectedCommunityId(project.comunidad.idComunidad);
          } else {
            setSearchTerm('');
            setSelectedCommunityId('');
          }
          setNoCapitulos(project.noCapitulos || '');
          setFechaInicio(project.fechaInicio ? new Date(project.fechaInicio).toISOString().split('T')[0] : '');
          setFechaFinAprox(project.fechaFinAprox ? new Date(project.fechaFinAprox).toISOString().split('T')[0] : '');
          setFaseActual(String(project.faseActual));
          setOriginalFaseActual(String(project.faseActual));
          
          setNombreCambiosCount(project.nombreCambiosCount || 0);
          setPoblacionBeneficiada(project.poblacionBeneficiada || '');

          if (project.imagenes && project.imagenes.length > 0) {
            setExistingImages(project.imagenes.map(img => ({
              ...img,
              fullUrl: `${process.env.REACT_APP_API_URL}${img.url}`
            })));
          } else {
            setExistingImages([]);
          }

          const personasResponse = await axios.get(`${process.env.REACT_APP_API_URL}/personas-proyecto/by-project/${idProyectoUrl}`);
          setPersonasDirectorio(personasResponse.data);

        } catch (err) {
          console.error("Error al cargar los datos del proyecto:", err);
          setError("No se pudieron cargar las comunidades.");
        } finally {
          setFormLoading(false);
        }
      };
      fetchProjectData();
    }
  }, [isEditing, idProyectoUrl, listaComunidades]);


  const handleAddPersona = () => {
    setPersonasDirectorio([...personasDirectorio, { apellidoPaterno: '', apellidoMaterno: '', nombre: '', rolEnProyecto: '', contacto: '' }]);
  };

  const handlePersonaChange = (index, field, value) => {
    const newPersonas = [...personasDirectorio];
    newPersonas[index][field] = value;
    setPersonasDirectorio(newPersonas);
  };

  const handleRemovePersona = (index) => {
    const newPersonas = personasDirectorio.filter((_, i) => i !== index);
    setPersonasDirectorio(newPersonas);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedCommunityId('');
    setShowDropdown(true);
  };

  const handleCommunitySelect = (comunidad) => {
    setSearchTerm(comunidad.nombre);
    setSelectedCommunityId(comunidad.idComunidad);
    setShowDropdown(false);
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => URL.createObjectURL(file));

    setNewImageFiles(prevFiles => [...prevFiles, ...files]);
    setNewImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    setError(null);
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setNewImagePreviews(prevPreviews => {
      URL.revokeObjectURL(prevPreviews[indexToRemove]);
      return prevPreviews.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleRemoveExistingImage = (imageIdToRemove) => {
    setImagesToDeleteIds(prevIds => [...prevIds, imageIdToRemove]);
    setExistingImages(prevImages => prevImages.filter(img => img.idProyectoImagen !== imageIdToRemove));
  };

  const handleFormSubmit = async () => {
    setError(null);
    setLoading(true);

    const token = sessionStorage.getItem('access_token');
    if (!token) {
      setError('No autorizado. Por favor, inicia sesión.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const formData = new FormData();
    if (isEditing) {
      formData.append('idProyecto', String(idProyecto));
    }
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('comunidadIdComunidad', selectedCommunityId ? String(selectedCommunityId) : '');
    formData.append('noCapitulos', noCapitulos ? String(noCapitulos) : '');
    formData.append('fechaInicio', fechaInicio);
    formData.append('fechaFinAprox', fechaFinAprox);
    formData.append('faseActual', String(faseActual));
    formData.append('poblacionBeneficiada', poblacionBeneficiada ? String(poblacionBeneficiada) : '');

    if (justificationText) {
      formData.append('justificacionFase', justificationText);
    }

    newImageFiles.forEach((file, index) => {
      formData.append(`images`, file);
    });

    formData.append('imagesToDeleteIds', JSON.stringify(imagesToDeleteIds));


    if (!selectedCommunityId) {
      if (searchTerm) {
        const matchedCommunity = listaComunidades.find(c => c.nombre.toLowerCase() === searchTerm.toLowerCase());
        if (matchedCommunity) {
          setSelectedCommunityId(matchedCommunity.idComunidad);
          formData.set('comunidadIdComunidad', String(matchedCommunity.idComunidad));
        } else {
          setError('Por favor, selecciona un municipio de la lista o asegúrate de que el nombre coincida exactamente.');
          setLoading(false);
          return;
        }
      } else {
          setError('El campo de comunidad es obligatorio.');
          setLoading(false);
          return;
      }
    }


    try {
      const API_URL_BASE = `${process.env.REACT_APP_API_URL}/proyectos`;
      let currentProjectId = Number(idProyecto);

      if (isEditing) {
        await axios.put(`${API_URL_BASE}/${idProyectoUrl}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        showNotification(`Proyecto "${nombre}" actualizado con éxito!`, 'success');
      } else {
        const response = await axios.post(API_URL_BASE, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        currentProjectId = response.data.idProyecto;
        localStorage.setItem('newProjectNotification', JSON.stringify({
          name: nombre,
          id: currentProjectId
        }));
        console.log('Notificación de nuevo proyecto guardada en localStorage:', { name: nombre, id: currentProjectId });
        showNotification(`Se ha subido un nuevo proyecto "${nombre}"`, 'success');
      }

      const personasInDbForProject = isEditing 
        ? (await axios.get(`${process.env.REACT_APP_API_URL}/personas-proyecto/by-project/${currentProjectId}`)).data
        : [];
      const personasIdsInDb = personasInDbForProject.map(p => p.idPersonaProyecto);
      const personasIdsInForm = personasDirectorio.map(p => p.idPersonaProyecto).filter(id => id);

      for (const dbId of personasIdsInDb) {
        if (!personasIdsInForm.includes(dbId)) {
          await axios.delete(`${process.env.REACT_APP_API_URL}/personas-proyecto/${dbId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      for (const persona of personasDirectorio) {
        if (!persona.apellidoPaterno && !persona.apellidoMaterno && !persona.nombre) {
          continue;
        }

        if (persona.idPersonaProyecto && personasIdsInDb.includes(persona.idPersonaProyecto)) {
          await axios.put(`${process.env.REACT_APP_API_URL}/personas-proyecto/${persona.idPersonaProyecto}`, {
            apellidoPaterno: persona.apellidoPaterno,
            apellidoMaterno: persona.apellidoMaterno || null,
            nombre: persona.nombre,
            rolEnProyecto: persona.rolEnProyecto || null,
            contacto: persona.contacto || null,
            proyectoIdProyecto: currentProjectId
          }, { headers: { Authorization: `Bearer ${token}` } });
        } else {
          await axios.post(`${process.env.REACT_APP_API_URL}/personas-proyecto`, {
            apellidoPaterno: persona.apellidoPaterno,
            apellidoMaterno: persona.apellidoMaterno || null,
            nombre: persona.nombre,
            rolEnProyecto: persona.rolEnProyecto || null,
            contacto: persona.contacto || null,
            proyectoIdProyecto: currentProjectId
          }, { headers: { Authorization: `Bearer ${token}` } });
        }
      }

      setLoading(false);
      navigate('/proyectos-turismo');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(err.response.data.message.join(', '));
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError(`Error al ${isEditing ? 'actualizar' : 'agregar'} el proyecto. Revisa la consola para más detalles.`);
      }
      console.error(`Error al ${isEditing ? 'actualizar' : 'agregar'} proyecto:`, err.response || err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing && String(faseActual) !== String(originalFaseActual)) {
      setShowJustificationModal(true);
    } else {
      handleFormSubmit();
    }
  };

  const handleJustificationSubmit = () => {
    if (!justificationText.trim()) {
      setError('La justificación es obligatoria si se cambia la fase.');
      return;
    }
    setShowJustificationModal(false);
    handleFormSubmit();
  };

  const handleJustificationCancel = () => {
    setShowJustificationModal(false);
    setJustificationText('');
    setFaseActual(originalFaseActual);
    setError(null);
  };


  if (formLoading) {
    return <div className="project-form-loading">Cargando datos del proyecto...</div>;
  }

  const isNameFieldDisabled = isEditing && nombreCambiosCount >= MAX_NAME_CHANGES;

  return (
    <div className="project-form-page">
      <div className="project-form-container">
        <h2>{isEditing ? `Editar Proyecto: ${nombre}` : 'Agregar Nuevo Proyecto de Turismo Comunitario'}</h2>
        <form onSubmit={handleSubmit} className="project-form">
          {isEditing && (
            <div className="form-group">
              <label htmlFor="idProyecto">ID del Proyecto:</label>
              <input
                type="number"
                id="idProyecto"
                value={idProyecto}
                onChange={(e) => setIdProyecto(e.target.value)}
                required
                disabled={true}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nombre">Nombre del Proyecto:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={isNameFieldDisabled}
            />
            {isEditing && (
              <p className="name-changes-info">
                Cambios de nombre de proyecto restantes: {MAX_NAME_CHANGES - nombreCambiosCount}
                {isNameFieldDisabled && <span className="name-changes-limit-reached"> (Límite alcanzado)</span>}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción:</label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group" ref={dropdownRef}>
            <label htmlFor="comunidadSearch">Comunidad:</label>
            <input
              type="text"
              id="comunidadSearch"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Busca o selecciona un municipio"
              required
            />
            {showDropdown && filteredComunidades.length > 0 && (
              <ul className="community-dropdown">
                {filteredComunidades.slice(0, 100).map((comunidad) => (
                  <li
                    key={comunidad.idComunidad}
                    onClick={() => handleCommunitySelect(comunidad)}
                  >
                    {comunidad.nombre}
                  </li>
                ))}
              </ul>
            )}
            {showDropdown && filteredComunidades.length === 0 && searchTerm !== '' && (
                <p className="no-results-message">No se encontraron municipios.</p>
            )}
          </div>

          {/* --- INICIO DEL CÓDIGO MODIFICADO --- */}
<div className="double-form-group">
    <div className="form-group">
        <label htmlFor="poblacionBeneficiada">Población Beneficiada:</label>
        <input
        type="text"
        id="poblacionBeneficiada"
        value={formatNumber(poblacionBeneficiada)}
        onChange={handlePoblacionChange}
        placeholder="Número de personas beneficiadas"
        />
    </div>
    <div className="form-group">
    <label htmlFor="noCapitulos">Número de Capítulos:</label>
    <input
    type="number"
    id="noCapitulos"
    value={noCapitulos}
    onChange={(e) => setNoCapitulos(e.target.value)}
    />
</div>
</div>
{/* --- FIN DEL CÓDIGO MODIFICADO --- */}

          {/* Campo para subir múltiples imágenes */}
          <div className="form-group">
            <label htmlFor="projectImages">Imágenes del Proyecto:</label>
            <input
              type="file"
              id="projectImages"
              accept="image/*" // Acepta cualquier tipo de imagen
              multiple // Permite seleccionar múltiples archivos
              onChange={handleNewImageChange}
            />
              <p className="image-specs-text">
                  Formatos soportados: JPG, JPEG, PNG, GIF. Máximo 15 fotos.
              </p>
            <div className="image-previews-container">
              {/* Previsualizaciones de imágenes existentes */}
              {existingImages.map(img => (
                <div key={img.idProyectoImagen} className="image-preview-item">
                  <img src={`${process.env.REACT_APP_API_URL}${img.fullUrl}`} alt="Existente" className="image-preview" />
                  <button type="button" onClick={() => handleRemoveExistingImage(img.idProyectoImagen)} className="remove-image-button">X</button>
                </div>
              ))}
              {/* Previsualizaciones de nuevas imágenes seleccionadas */}
              {newImagePreviews.map((previewUrl, index) => (
                <div key={`new-${index}`} className="image-preview-item">
                  <img src={previewUrl} alt={`Nueva ${index}`} className="image-preview" />
                  <button type="button" onClick={() => handleRemoveNewImage(index)} className="remove-image-button">X</button>
                </div>
              ))}
            </div>
            {(existingImages.length === 0 && newImageFiles.length === 0) && (
                <p className="no-images-message">No hay imágenes seleccionadas o existentes.</p>
            )}
          </div>

          <div className="personas-directorio-section">
            <h3>Personas Involucradas en el Proyecto</h3>
            {personasDirectorio.map((persona, index) => (
              <div key={persona.idPersonaProyecto || `new-${index}`} className="persona-input-group">
                <input
                  type="text"
                  placeholder="Apellido Paterno"
                  value={persona.apellidoPaterno}
                  onChange={(e) => handlePersonaChange(index, 'apellidoPaterno', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Apellido Materno (Opcional)"
                  value={persona.apellidoMaterno}
                  onChange={(e) => handlePersonaChange(index, 'apellidoMaterno', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Nombre(s)"
                  value={persona.nombre}
                  onChange={(e) => handlePersonaChange(index, 'nombre', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Rol (ej. Líder)"
                  value={persona.rolEnProyecto}
                  onChange={(e) => handlePersonaChange(index, 'rolEnProyecto', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Contacto (ej. email)"
                  value={persona.contacto}
                  onChange={(e) => handlePersonaChange(index, 'contacto', e.target.value)}
                />
                <button type="button" onClick={() => handleRemovePersona(index)} className="remove-persona-button">
                  X
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddPersona} className="add-persona-button">
              + Agregar Persona
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="fechaInicio">Fecha de Inicio:</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fechaFinAprox">Fecha Final (Aprox.):</label>
            <input
              type="date"
              id="fechaFinAprox"
              value={fechaFinAprox}
              onChange={(e) => setFechaFinAprox(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="faseActual">Fase Actual:</label>
            <select
              id="faseActual"
              value={faseActual}
              onChange={(e) => setFaseActual(e.target.value)}
            >
              {fases.map((fase) => (
                <option key={fase} value={fase}>
                  Fase {fase}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-buttons">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? (isEditing ? 'Actualizando...' : 'Agregando...') : (isEditing ? 'Actualizar Proyecto' : 'Agregar Proyecto')}
            </button>
            <button type="button" onClick={() => navigate('/proyectos-turismo')} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE JUSTIFICACIÓN */}
      {showJustificationModal && (
        <div className="justification-modal-overlay">
          <div className="justification-modal-content">
            <h3>Justificación de Cambio de Fase</h3>
            <p>Por favor, indica los motivos por los cuales estas cambiando la fase.</p>
            <textarea
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
              placeholder="Escribe tu justificación aquí..."
              rows="5"
            ></textarea>
            {error && <p className="error-message">{error}</p>}
            <div className="modal-buttons">
              <button onClick={handleJustificationSubmit} className="submit-button">
                Enviar Justificación
              </button>
              <button onClick={handleJustificationCancel} className="cancel-button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectForm;