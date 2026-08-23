import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { apiClient } from '../../../shared/lib/apiClient';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import {
  cerrarSesion as cerrarSesionRequest,
  iniciarSesion as iniciarSesionRequest,
  obtenerSesionActual,
  refrescarSesion as refrescarSesionRequest,
  type Usuario,
} from '../api/auth.api';
import { AuthContext, type AuthEstado } from './authContext';

/** Únicos roles que pueden usar el panel — la API no filtra por rol al
 * loguear (cualquier credencial válida entra), así que este chequeo lo
 * hace el Web después del login/bootstrap (requisito explícito del equipo). */
const ROLES_PANEL = ['ROOT', 'ADMINISTRADOR'] as const;

function tieneAccesoAlPanel(usuario: Usuario): boolean {
  return usuario.roles.some(
    (rol) => ROLES_PANEL.includes(rol.codigo as (typeof ROLES_PANEL)[number]) && rol.estado === 'habilitado',
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<AuthEstado>({ tipo: 'cargando' });
  // Ref para que el callback de apiClient (que vive fuera del ciclo de
  // render) siempre vea el estado más reciente, sin closures viejas. Se
  // actualiza en un efecto, nunca durante el render.
  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  const cerrarSesionLocal = useCallback((error?: string) => {
    setEstado({ tipo: 'anonimo', error });
  }, []);

  useEffect(() => {
    apiClient.onSesionExpirada = async () => {
      try {
        const { accessToken } = await refrescarSesionRequest();
        const actual = estadoRef.current;
        if (actual.tipo === 'autenticado') {
          setEstado({ ...actual, accessToken });
        }
        return accessToken;
      } catch {
        cerrarSesionLocal();
        return null;
      }
    };
    return () => {
      apiClient.onSesionExpirada = null;
    };
  }, [cerrarSesionLocal]);

  // Bootstrap: al abrir el panel, intenta restaurar sesión con la cookie
  // de refresh (el access token nunca se persiste, solo vive en memoria).
  useEffect(() => {
    let cancelado = false;

    async function restaurar() {
      try {
        const { accessToken } = await refrescarSesionRequest();
        const { usuario } = await obtenerSesionActual(accessToken);
        if (cancelado) return;

        if (!tieneAccesoAlPanel(usuario)) {
          await cerrarSesionRequest(accessToken).catch(() => undefined);
          if (!cancelado) setEstado({ tipo: 'anonimo' });
          return;
        }

        setEstado({ tipo: 'autenticado', usuario, accessToken });
      } catch {
        if (!cancelado) setEstado({ tipo: 'anonimo' });
      }
    }

    restaurar();
    return () => {
      cancelado = true;
    };
  }, []);

  const login = useCallback(async (correo: string, password: string) => {
    try {
      const { accessToken, usuario } = await iniciarSesionRequest(correo, password);

      if (!tieneAccesoAlPanel(usuario)) {
        // La API sí autenticó — la cuenta existe y la contraseña es
        // correcta — pero no tiene rol de panel. Se revoca esa sesión en
        // vez de dejarla colgada, y se rechaza del lado Web.
        await cerrarSesionRequest(accessToken).catch(() => undefined);
        setEstado({ tipo: 'anonimo', error: 'No tienes acceso a este panel.' });
        return;
      }

      setEstado({ tipo: 'autenticado', usuario, accessToken });
    } catch (error) {
      if (error instanceof ApiError) {
        setEstado({ tipo: 'anonimo', error: error.message });
        return;
      }
      if (error instanceof ApiSinConexionError) {
        setEstado({ tipo: 'anonimo', error: error.message });
        return;
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const actual = estadoRef.current;
    if (actual.tipo === 'autenticado') {
      await cerrarSesionRequest(actual.accessToken).catch(() => undefined);
    }
    setEstado({ tipo: 'anonimo' });
  }, []);

  return <AuthContext.Provider value={{ estado, login, logout }}>{children}</AuthContext.Provider>;
}
