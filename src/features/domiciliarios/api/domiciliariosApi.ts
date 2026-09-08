import { apiClient } from '../../../shared/lib/apiClient';

export type DomiciliarioPendiente = {
  usuarioId: string;
  nombreCompleto: string | null;
  telefono: string | null;
  solicitadoEn: string;
};

export type ValidacionHistorial = {
  decision: 'aprobado' | 'rechazado';
  motivo: string | null;
  creadoEn: string;
  adminCorreo: string;
};

export type DetalleDomiciliario = {
  nombreCompleto: string | null;
  telefono: string | null;
  estado: 'pendiente_validacion' | 'habilitado' | 'rechazado';
  solicitadoEn: string;
  direccion: string | null;
  vehiculoTipo: string | null;
  vehiculoPlaca: string | null;
  cedulaFrenteUrl: string | null;
  cedulaReversoUrl: string | null;
  licenciaUrl: string | null;
  soatUrl: string | null;
  tecnicomecanicaUrl: string | null;
  historial: ValidacionHistorial[];
};

/** Ronda 9 — estado por el que se puede filtrar el listado general. */
export type EstadoDomiciliarioAdmin = 'pendiente_validacion' | 'habilitado' | 'rechazado' | 'todos';

/** Ronda 9 — una fila del listado general (a diferencia de
 * `DomiciliarioPendiente`, cualquier estado, no solo pendiente). */
export type DomiciliarioAdmin = {
  usuarioId: string;
  nombreCompleto: string | null;
  correo: string;
  telefono: string | null;
  estado: 'pendiente_validacion' | 'habilitado' | 'rechazado';
  solicitadoEn: string;
  actualizadoEn: string;
};

type MensajeResultado = { message: string };

/** G01 — domiciliarios con validación pendiente, más antiguos primero. */
export function listarDomiciliariosPendientes(accessToken: string) {
  return apiClient.get('/admin/domiciliarios/pendientes', {
    accessToken,
  }) as Promise<DomiciliarioPendiente[]>;
}

/** Ronda 9 — listado general con filtro de estado; sin `estado` trae
 * solo los pendientes (comportamiento histórico). */
export function listarDomiciliariosAdmin(accessToken: string, estado?: EstadoDomiciliarioAdmin) {
  const query = estado ? `?estado=${estado}` : '';
  return apiClient.get(`/admin/domiciliarios${query}`, {
    accessToken,
  }) as Promise<DomiciliarioAdmin[]>;
}

/** G02/G06 — detalle (documentos como URL firmada) + historial de decisiones. */
export function obtenerDetalleDomiciliario(accessToken: string, domiciliarioId: string) {
  return apiClient.get(`/admin/domiciliarios/${domiciliarioId}`, {
    accessToken,
  }) as Promise<DetalleDomiciliario>;
}

/** G03/G05 — aprueba. Si falta documentación, la API responde 422 (ApiError) —
 * la Web ya deshabilita el botón antes de eso calculando lo mismo del lado
 * del cliente, esto es la defensa de backend por si igual se llega a llamar. */
export function aprobarDomiciliario(accessToken: string, domiciliarioId: string) {
  return apiClient.post(`/admin/domiciliarios/${domiciliarioId}/aprobar`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** G04 — rechaza con motivo obligatorio. */
export function rechazarDomiciliario(accessToken: string, domiciliarioId: string, motivo: string) {
  return apiClient.post(
    `/admin/domiciliarios/${domiciliarioId}/rechazar`,
    { motivo },
    { accessToken },
  ) as Promise<MensajeResultado>;
}
