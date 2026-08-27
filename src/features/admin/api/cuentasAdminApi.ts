import { apiClient } from '../../../shared/lib/apiClient';
import type { EstadoCuenta } from './usuariosAdminApi';

export type CodigoRol = 'PACIENTE' | 'DOMICILIARIO' | 'ADMINISTRADOR' | 'ROOT';

export type CuentaAdminResumen = {
  id: string;
  correo: string;
  nombreCompleto: string | null;
  telefono: string | null;
  estadoCuenta: EstadoCuenta;
  creadoEn: string;
  roles: CodigoRol[];
};

export type CuentaAdminDetalle = {
  id: string;
  correo: string;
  nombreCompleto: string | null;
  telefono: string | null;
  estadoCuenta: EstadoCuenta;
  fotoPerfilUrl: string | null;
  creadoEn: string;
  roles: CodigoRol[];
  paciente: {
    direccion: string | null;
    cedulaFrenteUrl: string | null;
    cedulaReversoUrl: string | null;
  } | null;
  domiciliario: {
    direccion: string | null;
    vehiculoTipo: string | null;
    vehiculoPlaca: string | null;
    cedulaFrenteUrl: string | null;
    cedulaReversoUrl: string | null;
    licenciaUrl: string | null;
    soatUrl: string | null;
    tecnicomecanicaUrl: string | null;
    disponible: boolean | null;
  } | null;
};

export type FiltrosCuentas = {
  rol?: CodigoRol;
  estado?: EstadoCuenta;
  busqueda?: string;
};

type MensajeResultado = { message: string };

function armarQuery(filtros: FiltrosCuentas): string {
  const params = new URLSearchParams();
  if (filtros.rol) params.set('rol', filtros.rol);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Panel admin — "administrar usuarios" ampliado a cualquier rol
 * (Paciente/Domiciliario/Administrador), distinto de `/admin/usuarios`
 * (que sigue siendo solo para crear/ver cuentas Administrador). */
export function listarCuentasAdmin(accessToken: string, filtros: FiltrosCuentas = {}) {
  return apiClient.get(`/admin/cuentas${armarQuery(filtros)}`, {
    accessToken,
  }) as Promise<CuentaAdminResumen[]>;
}

export function obtenerCuentaAdmin(accessToken: string, usuarioId: string) {
  return apiClient.get(`/admin/cuentas/${usuarioId}`, {
    accessToken,
  }) as Promise<CuentaAdminDetalle>;
}

/** Bloqueo administrativo (distinto de la autodesactivación) — un
 * Administrador solo puede bloquear Paciente/Domiciliario; bloquear un
 * Administrador/ROOT exige ROOT. */
export function bloquearCuenta(accessToken: string, usuarioId: string, motivo: string) {
  return apiClient.post(
    `/admin/cuentas/${usuarioId}/bloquear`,
    { motivo },
    { accessToken },
  ) as Promise<MensajeResultado>;
}

export function desbloquearCuenta(accessToken: string, usuarioId: string) {
  return apiClient.post(`/admin/cuentas/${usuarioId}/desbloquear`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}
