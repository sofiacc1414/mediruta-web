import { apiClient } from '../../../shared/lib/apiClient';

export type CrearAdministradorInput = {
  correo: string;
  password: string;
  nombreCompleto?: string;
  telefono?: string;
};

type CrearAdministradorResultado = {
  usuarioId: string;
  correo: string;
};

export type EstadoCuenta = 'activa' | 'bloqueada' | 'desactivada';

export type AdministradorResumen = {
  id: string;
  correo: string;
  nombreCompleto: string | null;
  telefono: string | null;
  estadoCuenta: EstadoCuenta;
  creadoEn: string;
};

export type AdministradorDetalle = {
  id: string;
  correo: string;
  nombreCompleto: string | null;
  telefono: string | null;
  estadoCuenta: EstadoCuenta;
  fotoPerfilUrl: string | null;
  creadoEn: string;
};

/** Solo ROOT — crea una cuenta ADMINISTRADOR directa (habilitada de una). */
export function crearAdministrador(accessToken: string, input: CrearAdministradorInput) {
  return apiClient.post('/admin/usuarios', input, {
    accessToken,
  }) as Promise<CrearAdministradorResultado>;
}

/** "Administrar usuarios creados" — todas las cuentas ADMINISTRADOR,
 * más recientes primero. */
export function listarAdministradores(accessToken: string) {
  return apiClient.get('/admin/usuarios', { accessToken }) as Promise<AdministradorResumen[]>;
}

/** Ficha de un administrador puntual. */
export function obtenerAdministrador(accessToken: string, usuarioId: string) {
  return apiClient.get(`/admin/usuarios/${usuarioId}`, {
    accessToken,
  }) as Promise<AdministradorDetalle>;
}
