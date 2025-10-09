// src/components/ProjectForm.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

import './ProjectForm.css';

const calculateTargetDate = (baseDate, months) => {
    if (!baseDate) return '';
    
    // Usar 'T00:00:00' evita problemas de zona horaria que pueden mover la fecha un día.
    const d = new Date(baseDate + 'T00:00:00'); 
    d.setMonth(d.getMonth() + months);

    // Formatear como YYYY-MM-DD
    return d.toISOString().split('T')[0];
};

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

    const [minDateFinAprox, setMinDateFinAprox] = useState('');
    const [maxDateFinAprox, setMaxDateFinAprox] = useState('');

    const [originalFaseActual, setOriginalFaseActual] = useState('');
    const [showJustificationModal, setShowJustificationModal] = useState(false);
    const [justificationText, setJustificationText] = useState('');

    const [showConcludePhaseModal, setShowConcludePhaseModal] = useState(false);
    const [concludeJustificationText, setConcludeJustificationText] = useState('');
    const [concludeDocumentFile, setConcludeDocumentFile] = useState(null);

    const [personasDirectorio, setPersonasDirectorio] = useState([]);

    const [nombreCambiosCount, setNombreCambiosCount] = useState(0);
    const MAX_NAME_CHANGES = 3;

    const MAX_PERSONAS_INVOLUCRADAS = 15; 

    const generateCollaboratorRoles = (currentPersonas) => {
        // Contar cuántos colaboradores ya existen

        const roles = [{ label: 'Líder', value: 'Líder' }];
        
        // Genera los siguientes roles de Colaborador hasta el límite máximo
        for (let i = 1; i <= MAX_PERSONAS_INVOLUCRADAS; i++) {
            roles.push({ label: `Colaborador ${i}`, value: `Colaborador ${i}` });
        }
        return roles;
    };

    const collaboratorRoles = generateCollaboratorRoles(personasDirectorio);


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


    const [originalProjectData, setOriginalProjectData] = useState(null);


    const [isFormDirty, setIsFormDirty] = useState(false);

    const capitulos = Array.from({ length: 3 }, (_, i) => i + 1);

    const formatNumber = (num) => {
        if (num === null || num === undefined || num === '') return '';
        return num.toLocaleString('en-US');
    };

    const handlePoblacionChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue.length <= 9 && /^\d*$/.test(rawValue)) {
            setPoblacionBeneficiada(rawValue);
            setError(null);
        } else if (rawValue.length > 9) {
            setError('La población beneficiada no puede exceder las 9 cifras.');
        } else if (!/^\d*$/.test(rawValue)) {
            setError('Solo se permiten dígitos numéricos.');
        }
    };

    const validateDateDifference = (start, end) => {
        if (!start || !end) {
            return { isValid: true, message: '' };
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // La diferencia de tiempo se calcula en milisegundos
        const timeDifference = endDate.getTime() - startDate.getTime();
        
        // Define la duración mínima y máxima en milisegundos (usando días como aproximación)
        const MIN_DURATION_IN_MS = 4 * 30 * 24 * 60 * 60 * 1000; // Aprox. 4 meses (120 días)
        const MAX_DURATION_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000; // Aprox. 12 meses (365 días)
        

        if (timeDifference < MIN_DURATION_IN_MS) {
            return { 
                isValid: false, 
                message: `La duración del proyecto debe ser de al menos 4 meses (aprox. ${Math.ceil(MIN_DURATION_IN_MS / (1000 * 60 * 60 * 24))} días).` 
            };
        }
        
        if (timeDifference > MAX_DURATION_IN_MS) {
            return { 
                isValid: false, 
                message: `La duración del proyecto no debe exceder los 12 meses (aprox. ${Math.ceil(MAX_DURATION_IN_MS / (1000 * 60 * 60 * 24))} días).` 
            };
        }

        return { isValid: true, message: '' };
    };

    const checkFormDirty = useCallback(() => {
        if (!originalProjectData) return false;

        const isDifferent =
            nombre !== originalProjectData.nombre ||
            descripcion !== originalProjectData.descripcion ||
            String(selectedCommunityId) !== String(originalProjectData.comunidad?.idComunidad || '') ||
            String(noCapitulos) !== String(originalProjectData.noCapitulos || '') ||
            fechaInicio !== (originalProjectData.fechaInicio ? new Date(originalProjectData.fechaInicio).toISOString().split('T')[0] : '') ||
            fechaFinAprox !== (originalProjectData.fechaFinAprox ? new Date(originalProjectData.fechaFinAprox).toISOString().split('T')[0] : '') ||
            String(poblacionBeneficiada) !== String(originalProjectData.poblacionBeneficiada || '') ||
            newImageFiles.length > 0 ||
            imagesToDeleteIds.length > 0 ||
            JSON.stringify(personasDirectorio) !== JSON.stringify(originalProjectData.personasDirectorio);

        setIsFormDirty(isDifferent);
    }, [
        nombre,
        descripcion,
        selectedCommunityId,
        noCapitulos,
        fechaInicio,
        fechaFinAprox,
        poblacionBeneficiada,
        newImageFiles,
        imagesToDeleteIds,
        personasDirectorio,
        originalProjectData
    ]);

    // Llama a checkFormDirty cada vez que los datos del formulario cambian
    useEffect(() => {
        if (isEditing) {
            checkFormDirty();
        }
    }, [checkFormDirty, isEditing]);

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

                    const personasResponse = await axios.get(`${process.env.REACT_APP_API_URL}/personas-proyecto/by-project/${idProyectoUrl}`);
                    const personasData = personasResponse.data;

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

                    setPersonasDirectorio(personasData);

                    setOriginalProjectData({
                        ...project,
                        personasDirectorio: personasData,
                        fechaInicio: project.fechaInicio,
                        fechaFinAprox: project.fechaFinAprox,
                    });

                } catch (err) {
                    console.error("Error al cargar los datos del proyecto:", err);
                    setError("No se pudieron cargar las comunidades.");
                } finally {
                    setFormLoading(false);
                }
            };
            fetchProjectData();
        } else {

            setIsFormDirty(true);
        }
    }, [isEditing, idProyectoUrl, setOriginalFaseActual]);

    useEffect(() => {
        const calculateAndSetLimits = () => {
            if (!fechaInicio) {
                setMinDateFinAprox('');
                setMaxDateFinAprox('');
                return;
            }
            
            // Requisitos: Mínimo 4 meses (120 días) y Máximo 12 meses (365 días)
            const minDate = calculateTargetDate(fechaInicio, 4);
            const maxDate = calculateTargetDate(fechaInicio, 12);
            
            setMinDateFinAprox(minDate);
            setMaxDateFinAprox(maxDate);

            // --- VALIDACIÓN DE COHERENCIA EN TIEMPO REAL ---
            if (fechaFinAprox) {
                const currentEnd = new Date(fechaFinAprox).getTime();
                const minTime = new Date(minDate).getTime();
                const maxTime = new Date(maxDate).getTime();

                // Si la fecha final actual es menor que el nuevo mínimo o mayor que el nuevo máximo, la borramos.
                if (currentEnd < minTime || currentEnd > maxTime) {
                    setFechaFinAprox(''); 
                    showNotification('La fecha final fue restablecida, ya que ya no cumple con el nuevo rango de duración (4 a 12 meses desde el inicio).', 'warning');
                }
            }
            // --- FIN VALIDACIÓN COHERENCIA ---
        };

        calculateAndSetLimits();
    }, [fechaInicio, fechaFinAprox, showNotification]);


    const handleAddPersona = () => {
    if (personasDirectorio.length >= MAX_PERSONAS_INVOLUCRADAS) {
      showNotification(`Límite alcanzado: Solo se permiten ${MAX_PERSONAS_INVOLUCRADAS} personas involucradas por proyecto.`, 'warning');
      return;
    }

        setPersonasDirectorio([
            ...personasDirectorio,
            { 
                apellidoPaterno: '', 
                apellidoMaterno: '', 
                nombre: '', 
                rolEnProyecto: '', // Dejamos vacío para que el usuario seleccione
                contacto: '',

                isEditingLocal: true,
            }
            
        ]);

        setIsFormDirty(true);

    };

    const handlePersonaChange = (index, field, value) => {
        const newPersonas = [...personasDirectorio];
        newPersonas[index][field] = value;

        if (field !== 'idPersonaProyecto' && newPersonas[index].isEditingLocal === false) {
            newPersonas[index].isEditingLocal = true;
        }

        setPersonasDirectorio(newPersonas);
    };

    const handleRemovePersona = (index) => {
        const newPersonas = personasDirectorio.filter((_, i) => i !== index);
        setPersonasDirectorio(newPersonas);
    };

    const handleAcceptPersona = (index) => {
        const persona = personasDirectorio[index];
        
        if (!persona.apellidoPaterno.trim() || !persona.nombre.trim() || !persona.rolEnProyecto.trim()) {
            showNotification('Error: Los campos Apellido Paterno, Nombre(s) y Rol son obligatorios para confirmar la persona.', 'error');
            return;
        }

        const newPersonas = [...personasDirectorio];
        newPersonas[index].isEditingLocal = false; // Se marca como confirmada
        setPersonasDirectorio(newPersonas);
        setIsFormDirty(true);
        showNotification('Persona involucrada confirmada con éxito.', 'success');
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

        const dateValidation = validateDateDifference(fechaInicio, fechaFinAprox);
    
    if (!dateValidation.isValid) {
        setError(dateValidation.message);
        showNotification(`Error de Fecha: ${dateValidation.message}`, 'error');
        setLoading(false);
        return; 
    }

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
        formData.append('faseActual', isEditing ? String(faseActual) : '1');
        formData.append('poblacionBeneficiada', poblacionBeneficiada ? String(poblacionBeneficiada).replace(/,/g, '') : '');

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

    const handleJustificationModalOpen = async (e) => {
        e.preventDefault();

        if (parseInt(faseActual) >= 7) {
            showNotification('El proyecto ya ha alcanzado la fase final (7).', 'info');
            return;
        }
        if (!isEditing) return;

        setConcludeJustificationText('');
        setConcludeDocumentFile(null);
        setError(null);
        setShowConcludePhaseModal(true);
    };

    const handleConcludeDocumentChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setConcludeDocumentFile(file);
            setError(null);
        } else {
            setConcludeDocumentFile(null);
            setError('Solo se permiten archivos PDF como documento de justificación.');
        }
    };

    const handleConcludePhaseSubmit = async () => {
        if (!concludeJustificationText.trim()) {
            setError('La justificación es obligatoria para avanzar de fase.');
            return;
        }
        if (!concludeDocumentFile) {
            setError('Se requiere un documento PDF que avale el cambio de fase.');
            return;
        }

        setLoading(true);
        setError(null);

        const token = sessionStorage.getItem('access_token');
        if (!token) {
            setError('No autorizado. Por favor, inicia sesión.');
            setLoading(false);
            navigate('/login');
            return;
        }

        const formData = new FormData();
        formData.append('justificacion', concludeJustificationText);
        formData.append('documento', concludeDocumentFile);

        try {
            const API_URL = `${process.env.REACT_APP_API_URL}/proyectos/${idProyectoUrl}/concluir-fase`;
            const response = await axios.patch(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            setFaseActual(String(response.data.faseActual));
            setOriginalFaseActual(String(response.data.faseActual));
            showNotification(`Fase del proyecto "${nombre}" avanzada a Fase ${response.data.faseActual}!`, 'success');

            setShowConcludePhaseModal(false);
            setLoading(false);


        } catch (err) {
            setLoading(false);
            if (err.response && err.response.data && err.response.data.message) {
                if (Array.isArray(err.response.data.message)) {
                    setError(err.response.data.message.join(', '));
                } else {
                    setError(err.response.data.message);
                }
            } else {
                setError('Error al avanzar de fase. Revisa la consola para más detalles.');
            }
            console.error('Error al avanzar de fase:', err.response || err);
        }
    };

    const handleConcludePhaseCancel = () => {
        setShowConcludePhaseModal(false);
        setConcludeJustificationText('');
        setConcludeDocumentFile(null);
        setError(null);
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


    const handleSubmit = async (e) => {
        e.preventDefault();
        handleFormSubmit();
    };

    if (formLoading) {
        return <div className="project-form-loading">Cargando datos del proyecto...</div>;
    }

    const isNameFieldDisabled = isEditing && nombreCambiosCount >= MAX_NAME_CHANGES;

    const isConcludePhaseButtonDisabled = parseInt(faseActual) >= 7;

    return (
        <div className="project-form-page">
            <div className="project-form-container">
                <h2>{isEditing ? `Editar Proyecto: ${nombre}` : 'Agregar Nuevo Proyecto de Turismo Comunitario'}</h2>
                <form onSubmit={handleSubmit} className="project-form">
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
                        <label htmlFor="comunidadSearch">Municipio:</label>
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
                            <select
                                id="noCapitulos"
                                value={noCapitulos}
                                onChange={(e) => setNoCapitulos(e.target.value)}
                            >
                                {capitulos.map((capitulo) => (
                                    <option key={capitulo} value={capitulo}>
                                        {capitulo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
    <label htmlFor="projectImages">Imágenes del Proyecto:</label>
    <input
        type="file"
        id="projectImages"
        accept="image/*"
        multiple
        onChange={handleNewImageChange}
    />
    <p className="image-specs-text">
        Formatos soportados: JPG, JPEG, PNG, GIF. Máximo 15 fotos.
    </p>

    {isEditing && existingImages.length > 0 && (
        <div className="existing-images-list">
            <h4 className="existing-images-title">Evidencias Subidas (Haga clic para ver):</h4>
            {existingImages.map((image, index) => (
                <div key={image.idProyectoImagen} className="existing-image-item">
                    <span 
                        className="image-url-link"
                        onClick={() => window.open(image.fullUrl, '_blank')}
                        title="Haga clic para abrir la imagen en una nueva pestaña"
                    >
                        Imagen #{index + 1}: {image.url.split('/').pop()}
                    </span>
                    
                    <button 
                        type="button" 
                        onClick={() => handleRemoveExistingImage(image.idProyectoImagen)}
                        className="remove-image-button"
                    >
                        Eliminar
                    </button>
                </div>
            ))}
        </div>
    )}

    <div className="image-previews-container">
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

        <div className="persona-input-group persona-header-labels">
        <label>Apellido Paterno</label>
        <label>Apellido Materno (Op.)</label>
        <label>Nombre(s)</label>
        <label>Rol</label>
        <label>Contacto</label>
        <div className="remove-placeholder remove-persona-button"></div> 
    </div>
                        {personasDirectorio.map((persona, index) => (
                            <div key={persona.idPersonaProyecto || `new-${index}`} className="persona-input-group">
                                <input
                                    type="text"
                                    placeholder="Apellido Paterno"
                                    value={persona.apellidoPaterno}
                                    onChange={(e) => handlePersonaChange(index, 'apellidoPaterno', e.target.value)}
                                    required
                                    disabled={!persona.isEditingLocal}
                                />
                                <input
                                    type="text"
                                    placeholder="Apellido Materno (Opcional)"
                                    value={persona.apellidoMaterno}
                                    onChange={(e) => handlePersonaChange(index, 'apellidoMaterno', e.target.value)}

                                    disabled={!persona.isEditingLocal}
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre(s)"
                                    value={persona.nombre}
                                    onChange={(e) => handlePersonaChange(index, 'nombre', e.target.value)}
                                    required

                                    disabled={!persona.isEditingLocal}
                                />
                                <select
                                    value={persona.rolEnProyecto}
                                    onChange={(e) => handlePersonaChange(index, 'rolEnProyecto', e.target.value)}
                                    required // Hacemos que la selección sea obligatoria
                                    // Usamos la misma clase que el input para mantener la estética
                                    className="select-rol"
                                    disabled={!persona.isEditingLocal}
                                >
                                {/* Opción por defecto (deshabilitada si ya hay un valor) */}
                                <option value="" disabled={!!persona.rolEnProyecto}>Seleccionar Rol</option>
    
                                {/* Mapear las opciones de roles, asegurando que 'Colaborador X' se use una vez */}
                                    {collaboratorRoles.map((role) => {
                                // Deshabilitamos los roles de Colaborador ya seleccionados por OTRAS personas
                                const isRoleUsed = personasDirectorio.some(
                                    (p, i) => i !== index && p.rolEnProyecto === role.value && role.value.startsWith('Colaborador')
                                    );

                                 return (
                                    <option 
                                        key={role.value} 
                                        value={role.value}
                                        disabled={isRoleUsed}
                                    >
                                {role.label}
                                    </option>
                                    );
                                    })}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Contacto (ej. email)"
                                    value={persona.contacto}
                                    onChange={(e) => handlePersonaChange(index, 'contacto', e.target.value)}
                                    disabled={!persona.isEditingLocal}
                                />
                                {persona.isEditingLocal ? (
                                    <button 
                                        type="button" 
                                        onClick={() => handleAcceptPersona(index)} 
                                        className="accept-persona-button"
                                        title="Aceptar y guardar cambios de esta persona"
                                    >
                                    ✓ 
                                </button>
                                 ) : (
                                    // Botón de Edición (para volver a abrir los campos)
                                <button 
                                type="button" 
                                onClick={() => {
                                const newPersonas = [...personasDirectorio];
                                    newPersonas[index].isEditingLocal = true;
                                    setPersonasDirectorio(newPersonas);
                                    setIsFormDirty(true);
                                }} 
                                    className="edit-persona-button"
                                    title="Editar datos de esta persona"
                                >
                                ✍
                                </button>
                                    )}
                                <button type="button" onClick={() => handleRemovePersona(index)} className="remove-persona-button">
                                    X
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddPersona} className={`add-persona-button ${personasDirectorio.length >= MAX_PERSONAS_INVOLUCRADAS ? 'disabled-limit' : ''}`}
                        disabled={personasDirectorio.length >= MAX_PERSONAS_INVOLUCRADAS}>
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
                                // --- CÓDIGO MODIFICADO: Aplicación de límites ---
                                min={minDateFinAprox}
                                max={maxDateFinAprox}
                                // --- FIN CÓDIGO MODIFICADO ---
                            />
                        </div>
                    {isEditing && (
                        <div className="form-group">
                            <label>Fase Actual: {faseActual}</label>
                            <button
                                type="button"
                                onClick={handleJustificationModalOpen}
                                className="concluir-fase-button"
                                disabled={isConcludePhaseButtonDisabled}
                            >
                                {parseInt(faseActual) < 7 ? 'Concluir Fase' : 'Proyecto Finalizado'}
                            </button>
                        </div>
                    )}

                    {error && <p className="error-message">{error}</p>}

                    <div className="form-buttons">
                        <button
                            type="submit"
                            disabled={loading || (isEditing && !isFormDirty)}
                            className="submit-button"
                        >
                            {loading ? (isEditing ? 'Actualizando...' : 'Agregando...') : (isEditing ? 'Actualizar Proyecto' : 'Agregar Proyecto')}
                        </button>
                        <button type="button" onClick={() => navigate('/proyectos-turismo')} className="cancel-button">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>

            {showConcludePhaseModal && (
                <div className="justification-modal-overlay">
                    <div className="justification-modal-content">
                        <h3>Concluir Fase {faseActual} a Fase {parseInt(faseActual) + 1}</h3>
                        <p>Por favor, explica por qué estás concluyendo esta fase y sube un documento de respaldo (PDF).</p>

                        <div className="form-group">
                            <label htmlFor="concludeJustification">Justificación:</label>
                            <textarea
                                id="concludeJustification"
                                value={concludeJustificationText}
                                onChange={(e) => setConcludeJustificationText(e.target.value)}
                                placeholder="Escribe tu justificación aquí..."
                                rows="5"
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

                        {error && <p className="error-message">{error}</p>}

                        <div className="justification-warning">
                          <p>
                          <span role="img" aria-label="advertencia">⚠️</span>
                          Después de confirmar el avance, no se podrá retroceder a una fase anterior.
                          </p>
                          </div>


                        <div className="modal-buttons">
                            <button onClick={handleConcludePhaseSubmit} className="submit-button" disabled={loading}>
                                {loading ? 'Enviando...' : 'Confirmar Avance de Fase'}
                            </button>
                            <button onClick={handleConcludePhaseCancel} className="cancel-button" disabled={loading}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showJustificationModal && (
                <div className="justification-modal-overlay">
                    <div className="justification-modal-content">
                        <h3>Justificación de Cambio General</h3>
                        <p>Por favor, explica los motivos de estos cambios.</p>
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