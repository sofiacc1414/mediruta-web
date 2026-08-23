import { apiClient } from '../../../shared/lib/apiClient';

export type RolAsignado = {
  codigo: 'PACIENTE' | 'DOMICILIARIO' | 'ADMINISTRADOR' | 'ROOT';
  estado: 'habilitado' | 'pendiente_validacion' | 'rechazado';
};

export type Usuario = {
  id: string;
  correo: string;
  estadoCuenta: 'activa';
  roles: RolAsignado[];
};

type LoginResultado = {
  accessToken: string;
  usuario: Usuario;
  // El refreshToken NUNCA llega acá — el flujo Web lo recibe por cookie
  // HttpOnly (X-Client-Type: web, ver apiClient.ts).
};

type RefrescarResultado = {
  accessToken: string;
};

type MensajeResultado = {
  message: string;
};

/** G03/G04 de HU-01 — login. La API no filtra por rol acá: el chequeo de
 * que solo ROOT/ADMINISTRADOR entren al panel lo hace AuthProvider después,
 * con GET /auth/me. */
export function iniciarSesion(correo: string, password: string) {
  return apiClient.post('/auth/login', { correo, password }) as Promise<LoginResultado>;
}

/** Restaura sesión al abrir el panel usando la cookie de refresh (silent refresh). */
export function refrescarSesion() {
  return apiClient.post('/auth/refrescar') as Promise<RefrescarResultado>;
}

/** Identidad + roles del usuario autenticado. */
export function obtenerSesionActual(accessToken: string) {
  return apiClient.get('/auth/me', { accessToken }) as Promise<{ usuario: Usuario }>;
}

/** G07 — cierra la sesión actual (revoca en la API y limpia la cookie). */
export function cerrarSesion(accessToken: string) {
  return apiClient.post('/auth/logout', undefined, { accessToken }) as Promise<void>;
}

/** G05 (paso 1) — solicita el OTP de recuperación por correo. */
export function solicitarRecuperacionContrasena(correo: string) {
  return apiClient.post('/auth/recuperar-contrasena', { correo }) as Promise<MensajeResultado>;
}

/** G05 (paso 2) — consume el OTP y fija una nueva contraseña. */
export function restablecerContrasena(correo: string, codigo: string, nuevaPassword: string) {
  return apiClient.post('/auth/restablecer-contrasena', {
    correo,
    codigo,
    nuevaPassword,
  }) as Promise<MensajeResultado>;
}

/** G06 — cambio de contraseña con sesión activa. */
export function cambiarContrasena(
  accessToken: string,
  passwordActual: string,
  nuevaPassword: string,
) {
  return apiClient.post(
    '/auth/cambiar-contrasena',
    { passwordActual, nuevaPassword },
    { accessToken },
  ) as Promise<MensajeResultado>;
}
