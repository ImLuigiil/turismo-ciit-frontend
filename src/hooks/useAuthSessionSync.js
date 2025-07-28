// src/hooks/useAuthSessionSync.js
import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Claves para el almacenamiento global en localStorage
const ACTIVE_ADMIN_SESSION_KEY = 'active_admin_session_info'; // Guarda el ID de la sesión activa y su timestamp

function useAuthSessionSync(isAdmin, onLogout) {
  const navigate = useNavigate();
  // Guardar una referencia persistente al ID de esta pestaña
  const currentSessionIdRef = useRef(null);

  // Generar un ID de sesión único al cargar el hook por primera vez
  if (currentSessionIdRef.current === null) {
    currentSessionIdRef.current = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  const currentSessionId = currentSessionIdRef.current;

  // Función para registrar esta pestaña como la activa
  const registerActiveSession = useCallback(() => {
    if (isAdmin) {
      const sessionInfo = {
        id: currentSessionId,
        timestamp: Date.now(),
      };
      // Usamos localStorage para que sea visible entre todas las pestañas
      localStorage.setItem(ACTIVE_ADMIN_SESSION_KEY, JSON.stringify(sessionInfo));
      console.log(`[SessionSync] Registrando actividad para sesión: ${currentSessionId}`);
    }
  }, [isAdmin, currentSessionId]);

  // Función para manejar los cambios en localStorage (cuando otra pestaña escribe)
  const handleStorageChange = useCallback((event) => {
    if (event.key === ACTIVE_ADMIN_SESSION_KEY) {
      try {
        const newSessionInfo = event.newValue ? JSON.parse(event.newValue) : null;
        // Si el cambio no fue de esta misma sesión y existe información
        if (newSessionInfo && newSessionInfo.id !== currentSessionId) {
          console.warn(`[SessionSync] Otra sesión (<span class="math-inline">\{newSessionInfo\.id\}\) detectada\. Esta sesión \(</span>{currentSessionId}) será invalidada.`);
          // Cerrar sesión en esta pestaña
          onLogout();
          navigate('/login');
          alert('Otra sesión de administrador ha tomado el control. Tu sesión actual ha sido cerrada.');
        }
      } catch (e) {
        console.error('[SessionSync] Error al parsear sessionInfo de localStorage:', e);
      }
    }
    // También escucha si el token fue eliminado (ej. logout manual en otra pestaña)
    if (event.key === 'access_token' && !event.newValue && isAdmin) {
      console.warn('[SessionSync] Token de acceso eliminado en otra pestaña. Cerrando sesión en esta pestaña.');
      onLogout();
      navigate('/login');
      alert('Tu sesión de administrador ha sido cerrada desde otra pestaña/ventana.');
    }
  }, [currentSessionId, isAdmin, onLogout, navigate]);

  useEffect(() => {
    // Al cargar o cambiar isAdmin
    if (isAdmin) {
      // Registrar esta pestaña como la activa (inicialmente y periódicamente)
      registerActiveSession();

      // Verificar si ya hay una sesión activa y muy reciente de otra pestaña al cargar
      const existingSessionInfo = localStorage.getItem(ACTIVE_ADMIN_SESSION_KEY);
      if (existingSessionInfo) {
        try {
          const info = JSON.parse(existingSessionInfo);
          // Si la última actividad fue muy reciente (ej. en los últimos 5 segundos)
          // y el ID no coincide con el de esta pestaña
          if (Date.now() - info.timestamp < 5000 && info.id !== currentSessionId) {
            console.warn(`[SessionSync] Sesión activa (<span class="math-inline">\{info\.id\}\) detectada al cargar\. Invalidando esta sesión \(</span>{currentSessionId}).`);
            onLogout();
            navigate('/login');
            alert('Ya existe una sesión de administrador activa. Tu intento de inicio de sesión en esta pestaña ha sido redirigido.');
            return; // Importante para salir del useEffect y evitar conflictos
          }
        } catch (e) {
          console.error('[SessionSync] Error al verificar sesión existente:', e);
        }
      }

      // Iniciar el "heartbeat" periódico
      const heartbeatInterval = setInterval(registerActiveSession, 3000); // Actualiza cada 3 segundos

      // Escuchar cambios en localStorage de otras pestañas
      window.addEventListener('storage', handleStorageChange);

      // Manejar el cierre de la pestaña/ventana
      const handleBeforeUnload = () => {
        // Si esta era la sesión activa, limpiar el marcador de actividad al cerrar
        const currentActiveInfo = localStorage.getItem(ACTIVE_ADMIN_SESSION_KEY);
        if (currentActiveInfo && JSON.parse(currentActiveInfo).id === currentSessionId) {
          localStorage.removeItem(ACTIVE_ADMIN_SESSION_KEY);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Función de limpieza al desmontar el componente
      return () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // Asegurarse de limpiar el heartbeat si esta era la sesión activa
        handleBeforeUnload(); // Llama la función de limpieza al desmontar
      };
    } else {
      // Si no es admin, limpiar cualquier rastro de sesión en localStorage
      localStorage.removeItem(ACTIVE_ADMIN_SESSION_KEY);
      // Si por alguna razón la "access_token" está en localStorage (no sessionStorage), también la limpiamos
      // (Aunque ya la movemos a sessionStorage, esto es un catch-all)
      localStorage.removeItem('access_token');
    }
  }, [isAdmin, registerActiveSession, handleStorageChange, onLogout, navigate, currentSessionId]);

  // El hook no renderiza nada, solo maneja la lógica
  return null;
}

export default useAuthSessionSync;