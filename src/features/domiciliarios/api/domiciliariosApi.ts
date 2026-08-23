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
  cedulaUrl: string | null;
  licenciaUrl: string | null;
  soatUrl: string | null;
  tecnicomecanicaUrl: string | null;
  historial: ValidacionHistorial[];
};

type MensajeResultado = { message: string };

/** G01 — domiciliarios con validación pendiente, más antiguos primero. */
export function listarDomiciliariosPendientes(accessToken: string) {
  return apiClient.get('/admin/domiciliarios/pendientes', {
    accessToken,
  }) as Promise<DomiciliarioPendiente[]>;
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
