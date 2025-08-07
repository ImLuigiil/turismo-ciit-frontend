// src/hooks/useAuthSessionSync.js
import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIVE_ADMIN_SESSION_KEY = 'active_admin_session_info';

function useAuthSessionSync(isAdmin, onLogout) {
  const navigate = useNavigate();
  const currentSessionIdRef = useRef(null);

  if (currentSessionIdRef.current === null) {
    currentSessionIdRef.current = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  const currentSessionId = currentSessionIdRef.current;

  const registerActiveSession = useCallback(() => {
    if (isAdmin) {
      const sessionInfo = {
        id: currentSessionId,
        timestamp: Date.now(),
      };
      localStorage.setItem(ACTIVE_ADMIN_SESSION_KEY, JSON.stringify(sessionInfo));
      console.log(`[SessionSync] Registrando actividad para sesión: ${currentSessionId}`);
    }
  }, [isAdmin, currentSessionId]);

  const handleStorageChange = useCallback((event) => {
    if (event.key === ACTIVE_ADMIN_SESSION_KEY) {
      try {
        const newSessionInfo = event.newValue ? JSON.parse(event.newValue) : null;
        if (newSessionInfo && newSessionInfo.id !== currentSessionId) {
          console.warn('Otra sesión de administrador detectada. Cerrando sesión en esta pestaña.');
          onLogout();
          navigate('/login');
          alert('Otra sesión de administrador ha tomado el control. Tu sesión actual ha sido cerrada.');
        }
      } catch (e) {
        console.error('[SessionSync] Error al parsear sessionInfo de localStorage:', e);
      }
    }
    if (event.key === 'access_token' && !event.newValue && isAdmin) {
      console.warn('[SessionSync] Token de acceso eliminado en otra pestaña. Cerrando sesión en esta pestaña.');
      onLogout();
      navigate('/login');
      alert('Tu sesión de administrador ha sido cerrada desde otra pestaña/ventana.');
    }
  }, [currentSessionId, isAdmin, onLogout, navigate]);

  useEffect(() => {
    if (isAdmin) {
      registerActiveSession();

      const existingSessionInfo = localStorage.getItem(ACTIVE_ADMIN_SESSION_KEY);
      if (existingSessionInfo) {
        try {
          const info = JSON.parse(existingSessionInfo);
          if (Date.now() - info.timestamp < 5000 && info.id !== currentSessionId) {
            console.warn('Sesión de administrador activa en otra pestaña al cargar. Esta pestaña se cerrará.');
            onLogout();
            navigate('/login');
            alert('Ya existe una sesión de administrador activa. Tu intento de inicio de sesión en esta pestaña ha sido redirigido.');
            return; 
          }
        } catch (e) {
          console.error('[SessionSync] Error al verificar sesión existente:', e);
        }
      }

      const heartbeatInterval = setInterval(registerActiveSession, 3000);

      window.addEventListener('storage', handleStorageChange);

      const handleBeforeUnload = () => {
        const currentActiveInfo = localStorage.getItem(ACTIVE_ADMIN_SESSION_KEY);
        if (currentActiveInfo && JSON.parse(currentActiveInfo).id === currentSessionId) {
          localStorage.removeItem(ACTIVE_ADMIN_SESSION_KEY);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        handleBeforeUnload();
      };
    } else {
      localStorage.removeItem(ACTIVE_ADMIN_SESSION_KEY);
      localStorage.removeItem('access_token');
    }
  }, [isAdmin, registerActiveSession, handleStorageChange, onLogout, navigate, currentSessionId]);

  return null;
}

export default useAuthSessionSync;