// src/components/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './LoginPage.css';

function LoginPage({ onLoginSuccess }) {
  const [usuariocol, setUsuariocol] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const API_URL = 'http://localhost:3000/auth/login';

      const response = await axios.post(API_URL, {
        usuariocol,
        contrasena,
      });

      const { access_token } = response.data;

      // --- CAMBIO CLAVE AQUÍ: De localStorage a sessionStorage ---
      sessionStorage.setItem('access_token', access_token);
      // --- FIN CAMBIO CLAVE ---

      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      navigate('/proyectos-turismo');
      alert('¡Inicio de sesión exitoso como administrador!');

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        if (Array.isArray(err.response.data.message)) {
          setError(err.response.data.message.join(', '));
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError('Error de red o del servidor. Inténtalo de nuevo.');
      }
      console.error('Error durante el login:', err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Inicio de Sesión (Administrador)</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="usuariocol">Usuario:</label>
            <input
              type="text"
              id="usuariocol"
              value={usuariocol}
              onChange={(e) => setUsuariocol(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contrasena">Contraseña:</label>
            <input
              type="password"
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;