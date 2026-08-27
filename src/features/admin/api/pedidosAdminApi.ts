import { apiClient } from '../../../shared/lib/apiClient';

export type EstadoPedido =
  | 'borrador'
  | 'pendiente_revision'
  | 'en_asignacion'
  | 'asignado_en_camino_farmacia'
  | 'medicamentos_recogidos'
  | 'en_camino_entrega'
  | 'en_sitio'
  | 'entregado'
  | 'cancelada';

export type PedidoAdmin = {
  id: string;
  codigoPedido: string;
  estado: EstadoPedido;
  pacienteNombre: string | null;
  pacienteCorreo: string;
  domiciliarioNombre: string | null;
  domiciliarioCorreo: string | null;
  direccionEntrega: string | null;
  direccionFarmacia: string | null;
  creadoEn: string;
  enviadoEn: string | null;
  /** Desde cuándo está en `en_asignacion` — `null` si nunca pasó por
   * ahí o ya tiene domiciliario. Se compara contra el umbral
   * configurable para mostrar la alarma de "demorado". */
  enAsignacionDesde: string | null;
};

export type FiltrosPedidos = {
  estado?: EstadoPedido;
  desde?: string;
  hasta?: string;
  busqueda?: string;
  pacienteBusqueda?: string;
  domiciliarioBusqueda?: string;
};

export type OrigenNovedad = 'domiciliario' | 'paciente';

export type NovedadAbierta = {
  id: string;
  solicitudId: string;
  codigoPedido: string | null;
  detalle: string;
  reportadaPorCorreo: string;
  origen: OrigenNovedad;
  creadoEn: string;
};

export type DomiciliarioCercano = {
  usuarioId: string;
  nombreCompleto: string | null;
  telefono: string | null;
  distanciaMetros: number;
};

export type EventoHistorial = {
  estado: EstadoPedido;
  creadoEn: string;
};

export type Medicamento = {
  nombre: string | null;
  concentracion: string | null;
  formaFarmaceutica: string | null;
  cantidad: string | null;
  posologia: string | null;
};

export type NovedadDelPedido = {
  id: string;
  detalle: string;
  origen: OrigenNovedad;
  creadoEn: string;
};

export type DetallePedidoAdmin = {
  id: string;
  codigoPedido: string;
  estado: EstadoPedido;
  recetaUrl: string | null;
  recetaFechaVencimiento: string | null;
  direccionEntrega: string | null;
  direccionFarmacia: string | null;
  creadoEn: string;
  enviadoEn: string | null;
  canceladoEn: string | null;
  codigoEntrega: string | null;
  paciente: {
    nombre: string | null;
    correo: string;
    telefono: string | null;
    cedulaFrenteUrl: string | null;
    cedulaReversoUrl: string | null;
  };
  domiciliario: {
    nombre: string | null;
    correo: string;
    telefono: string | null;
  } | null;
  medicamentos: Medicamento[];
  historial: EventoHistorial[];
  novedadAbierta: NovedadDelPedido | null;
  enAsignacionDesde: string | null;
};

type MensajeResultado = { message: string };

function armarQuery(filtros: FiltrosPedidos): string {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  if (filtros.pacienteBusqueda) params.set('pacienteBusqueda', filtros.pacienteBusqueda);
  if (filtros.domiciliarioBusqueda) {
    params.set('domiciliarioBusqueda', filtros.domiciliarioBusqueda);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Panel admin — "ver y filtrar pedidos". Tope de 200 filas, más
 * recientes primero (ver `app.listar_pedidos_admin`). */
export function listarPedidosAdmin(accessToken: string, filtros: FiltrosPedidos = {}) {
  return apiClient.get(`/admin/pedidos${armarQuery(filtros)}`, {
    accessToken,
  }) as Promise<PedidoAdmin[]>;
}

/** "Ver el detalle de cada pedido, no solo el listado": datos +
 * medicamentos + tracking + novedad abierta + cédula del paciente. */
export function obtenerDetallePedidoAdmin(accessToken: string, pedidoId: string) {
  return apiClient.get(`/admin/pedidos/${pedidoId}`, {
    accessToken,
  }) as Promise<DetallePedidoAdmin>;
}

/** HU-07 — novedades reportadas por Domiciliarios, todavía sin resolver. */
export function listarNovedadesAbiertas(accessToken: string) {
  return apiClient.get('/admin/novedades', { accessToken }) as Promise<NovedadAbierta[]>;
}

/** HU-07 — marca una novedad como atendida. No toca el estado del pedido. */
export function resolverNovedad(accessToken: string, novedadId: string) {
  return apiClient.post(`/admin/novedades/${novedadId}/resolver`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** Pedido demorado sin domiciliario — candidatos disponibles más
 * cercanos a la farmacia de ese pedido. */
export function listarDomiciliariosCercanos(accessToken: string, pedidoId: string) {
  return apiClient.get(`/admin/pedidos/${pedidoId}/domiciliarios-cercanos`, {
    accessToken,
  }) as Promise<DomiciliarioCercano[]>;
}

/** Asignación manual — misma transición que cuando el domiciliario
 * acepta su propio pedido, pero elegida por el admin. */
export function asignarDomiciliario(accessToken: string, pedidoId: string, domiciliarioId: string) {
  return apiClient.post(
    `/admin/pedidos/${pedidoId}/asignar`,
    { domiciliarioId },
    { accessToken },
  ) as Promise<MensajeResultado>;
}
