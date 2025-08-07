// src/components/CursoForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext'; 

import './CursoForm.css'; 

function CursoForm() {
  const { idCursoUrl } = useParams(); 
  const isEditing = !!idCursoUrl;

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('video');
  const [link, setLink] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); 
  const [currentFileUrl, setCurrentFileUrl] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isEditing) {
      setFormLoading(true);
      const fetchCursoData = async () => {
        try {
          const API_URL_BASE = `${process.env.REACT_APP_API_URL}/cursos`;
          const response = await axios.get(`${API_URL_BASE}/${idCursoUrl}`);
          const curso = response.data;

          setNombre(curso.nombre || '');
          setTipo(curso.tipo || 'video');
          setLink(curso.link || '');
          
          if (curso.tipo === 'pdf' && curso.link) {
            setCurrentFileUrl(`${process.env.REACT_APP_API_URL}${curso.link}`);
          } else {
            setCurrentFileUrl('');
          }

        } catch (err) {
          console.error("Error al cargar los datos del curso:", err);
          setError("No se pudieron cargar los datos del curso.");
        } finally {
          setFormLoading(false);
        }
      };
      fetchCursoData();
    }
  }, [isEditing, idCursoUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setLink(''); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleLinkChange = (e) => {
    setLink(e.target.value);
    setError(null);
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    formData.append('nombre', nombre);
    formData.append('tipo', tipo);

    if (tipo === 'video') {
      if (!link || !link.startsWith('http')) {
        setError('Para cursos de video, se requiere una URL válida.');
        setLoading(false);
        return;
      }
      formData.append('link', link);
    } else if (tipo === 'pdf') {
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (isEditing && currentFileUrl) {
        formData.append('link', link);
      } else {
        setError('Para cursos PDF, se requiere un archivo PDF.');
        setLoading(false);
        return;
      }
    }

    try {
      const API_URL_BASE = `${process.env.REACT_APP_API_URL}/cursos`;
      
      if (isEditing) {
        await axios.put(`${API_URL_BASE}/${idCursoUrl}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        showNotification(`Curso "${nombre}" actualizado con éxito!`, 'success');
      } else {
        await axios.post(API_URL_BASE, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        showNotification(`Se ha subido un nuevo curso "${nombre}"!`, 'success');
      }

      setLoading(false);
      navigate('/cursos');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(err.response.data.message.join(', '));
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError(`Error al ${isEditing ? 'actualizar' : 'agregar'} el curso. Revisa la consola.`);
      }
      console.error(`Error al ${isEditing ? 'actualizar' : 'agregar'} curso:`, err.response || err);
    }
  };

  if (formLoading) {
    return <div className="curso-form-loading">Cargando datos del curso...</div>;
  }

  return (
    <div className="curso-form-page">
      <div className="curso-form-container">
        <h2>{isEditing ? `Editar Curso: ${nombre}` : 'Agregar Nuevo Curso'}</h2>
        <form onSubmit={handleSubmit} className="curso-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre del Curso:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tipo">Tipo de Curso:</label>
            <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="video">Video (YouTube, etc.)</option>
              <option value="pdf">Documento PDF</option>
            </select>
          </div>

          {tipo === 'video' && (
            <div className="form-group">
              <label htmlFor="link">Enlace de Video (URL):</label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={handleLinkChange}
                placeholder="Ej: https://www.youtube.com/watch?v=..."
                required
              />
            </div>
          )}

          {tipo === 'pdf' && (
            <div className="form-group">
              <label htmlFor="file">Archivo PDF:</label>
              <input
                type="file"
                id="file"
                accept=".pdf"
                onChange={handleFileChange}
                required={!isEditing || !currentFileUrl}
              />
              {selectedFile && <p className="selected-file-name">Archivo seleccionado: {selectedFile.name}</p>}
              {isEditing && currentFileUrl && !selectedFile && (
                <p className="current-file-info">
                  PDF actual: <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">Ver PDF</a>
                </p>
              )}
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="form-buttons">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Curso' : 'Agregar Curso')}
            </button>
            <button type="button" onClick={() => navigate('/cursos')} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CursoForm;
