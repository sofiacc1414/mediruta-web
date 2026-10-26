import { apiClient } from '../../../shared/lib/apiClient';

/** G01-G05 — comportamiento operativo de un domiciliario, agregado
 * para un rango de fechas. `rechazos` queda siempre `null`: no existe
 * en el sistema un evento de "domiciliario rechaza un pedido
 * ofrecido" (el modelo de asignación es por aceptar primero) — se
 * muestra como "no disponible", no como "0 rechazos reales". */
export type ResumenComportamientoDomiciliario = {
  domiciliarioId: string;
  nombreCompleto: string;
  correo: string;
  estadoCuenta: 'activa' | 'bloqueada' | 'desactivada';
  entregasRealizadas: number;
  cancelaciones: number;
  incidentesReportados: number;
  incidentesAbiertos: number;
  calificacionPromedio: number | null;
  calificacionesCantidad: number;
  rechazos: null;
};

export type EventoComportamiento =
  | { tipo: 'entrega'; solicitudId: string; codigoPedido: string | null; fecha: string }
  | { tipo: 'cancelacion'; solicitudId: string; codigoPedido: string | null; fecha: string }
  | {
      tipo: 'incidente';
      solicitudId: string;
      codigoPedido: string | null;
      detalle: string;
      resuelto: boolean;
      fecha: string;
    }
  | {
      tipo: 'calificacion';
      solicitudId: string;
      codigoPedido: string | null;
      puntuacion: number;
      comentario: string | null;
      fecha: string;
    };

export type DetalleComportamientoDomiciliario = {
  resumen: ResumenComportamientoDomiciliario;
  eventos: EventoComportamiento[];
};

/** G01/G03. */
export function listarComportamientoDomiciliarios(
  accessToken: string,
  desde: string,
  hasta: string,
) {
  return apiClient.get(
    `/admin/comportamiento-domiciliarios?desde=${desde}&hasta=${hasta}`,
    { accessToken },
  ) as Promise<ResumenComportamientoDomiciliario[]>;
}

/** G02 — detalle de un domiciliario puntual (incluye G05: si no hay
 * eventos, `eventos` llega vacío y los contadores del resumen en 0). */
export function obtenerDetalleComportamientoDomiciliario(
  accessToken: string,
  domiciliarioId: string,
  desde: string,
  hasta: string,
) {
  return apiClient.get(
    `/admin/comportamiento-domiciliarios/${domiciliarioId}?desde=${desde}&hasta=${hasta}`,
    { accessToken },
  ) as Promise<DetalleComportamientoDomiciliario>;
}
