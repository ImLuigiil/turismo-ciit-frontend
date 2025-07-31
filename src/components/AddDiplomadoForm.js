// src/components/AddDiplomadoForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddDiplomadoForm.css';

function AddDiplomadoForm() {
  const [nombre, setNombre] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    if (!nombre) {
      setError('El nombre del diplomado es obligatorio.');
      setLoading(false);
      return;
    }

    if (!selectedFile) {
      setError('Debes seleccionar un archivo PDF.');
      setLoading(false);
      return;
    }

    // --- CAMBIO CLAVE AQUÍ: De localStorage a sessionStorage ---
    const token = sessionStorage.getItem('access_token');
    // --- FIN CAMBIO CLAVE ---
    if (!token) {
      setError('No autorizado. Por favor, inicia sesión.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('file', selectedFile);

    try {
      const API_URL = `${process.env.REACT_APP_API_URL}/diplomados`;

      await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setLoading(false);
      alert('Diplomado agregado y archivo subido con éxito!');
      navigate('/diplomados');
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(err.response.data.message.join(', '));
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError('Error al subir el diplomado. Revisa la consola para más detalles.');
      }
      console.error('Error al subir diplomado:', err.response || err);
    }
  };

  return (
    <div className="add-diplomado-page">
      <div className="add-diplomado-container">
        <h2>Subir Nuevo Diplomado</h2>
        <form onSubmit={handleSubmit} className="add-diplomado-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre del Diplomado:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">Archivo PDF:</label>
            <input
              type="file"
              id="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
            {selectedFile && <p className="selected-file-name">Archivo seleccionado: {selectedFile.name}</p>}
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-buttons">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Subiendo...' : 'Agregar Diplomado'}
            </button>
            <button type="button" onClick={() => navigate('/diplomados')} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDiplomadoForm;