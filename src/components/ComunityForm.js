// src/components/CommunityForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CommunityForm.css'; // Crearemos este CSS en el siguiente paso

function CommunityForm() {
  const [idComunidad, setIdComunidad] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    const communityData = {
      idComunidad: parseInt(idComunidad),
      nombre,
      ubicacion,
      poblacion: poblacion ? parseInt(poblacion) : null,
    };

    try {
      await axios.post('http://localhost:3000/comunidades', communityData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Comunidad agregada con éxito!');
      setLoading(false);
      navigate('/proyectos/nuevo'); // Redirige de vuelta al formulario de proyectos
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(err.response.data.message.join(', '));
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError("Error al agregar la comunidad. Revisa la consola para más detalles.");
      }
      console.error("Error al agregar comunidad:", err.response || err);
    }
  };

  return (
    <div className="community-form-page">
      <div className="community-form-container">
        <h2>Agregar Nueva Comunidad</h2>
        <form onSubmit={handleSubmit} className="community-form">
          <div className="form-group">
            <label htmlFor="idComunidad">ID de Comunidad:</label>
            <input
              type="number"
              id="idComunidad"
              value={idComunidad}
              onChange={(e) => setIdComunidad(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre de la Comunidad (Municipio):</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ubicacion">Ubicación (Región):</label>
            <input
              type="text"
              id="ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="poblacion">Población:</label>
            <input
              type="number"
              id="poblacion"
              value={poblacion}
              onChange={(e) => setPoblacion(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="form-buttons">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Agregando...' : 'Agregar Comunidad'}
            </button>
            <button type="button" onClick={() => navigate('/proyectos/nuevo')} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunityForm;