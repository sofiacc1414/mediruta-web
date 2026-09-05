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

/** HU-07 (ronda 3) — clasifica la novedad: 'pregunta' es el mensaje
 * directo de siempre; 'edicion' trae `datosActuales`/`datosPropuestos`
 * para pintar el diff antes de aprobar/rechazar; 'codigo' es "no vi mi
 * código de entrega", sin datos propuestos. */
export type TipoNovedad = 'pregunta' | 'edicion' | 'codigo';

/** Ronda 4 — además de direcciones, ahora también puede traer
 * `medicamentos` (reemplazo completo de la lista) y/o `recetaPath`
 * (nunca se expone tal cual — ver `NovedadAbierta.recetaActualUrl`/
 * `recetaPropuestaUrl`, ya firmadas por la API). Todo opcional: cada
 * campo presente es un dato que el paciente pidió cambiar. */
export type DatosEdicionPedido = {
  direccionEntrega: string | null;
  direccionFarmacia: string | null;
  medicamentos?: Medicamento[];
  recetaPath?: string;
};

export type NovedadAbierta = {
  id: string;
  solicitudId: string;
  codigoPedido: string | null;
  detalle: string;
  reportadaPorCorreo: string;
  origen: OrigenNovedad;
  tipo: TipoNovedad;
  datosActuales: DatosEdicionPedido | null;
  datosPropuestos: DatosEdicionPedido | null;
  /** Código de entrega vigente del pedido — solo relevante cuando
   * `tipo = 'codigo'`. */
  codigoEntrega: string | null;
  /** URLs firmadas de la receta vigente y de la propuesta (si la hay)
   * — solo relevante cuando `tipo = 'edicion'`. */
  recetaActualUrl?: string | null;
  recetaPropuestaUrl?: string | null;
  creadoEn: string;
  /** HU-07 (ronda 6) — si ya fue atendida, y con qué resultado (solo
   * relevante para `tipo === 'edicion'`). */
  resuelta: boolean;
  accionEdicion: 'aprobada' | 'rechazada' | null;
};

/** HU-07 (ronda 6) — estado por el que se puede filtrar el listado de
 * novedades del admin. 'abierta' es el default histórico. */
export type EstadoNovedadAdmin = 'abierta' | 'aprobada' | 'rechazada' | 'resuelta' | 'todas';

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

/** HU-07 — novedades reportadas por pacientes/domiciliarios. Sin `estado`
 * trae solo las abiertas (comportamiento histórico); ronda 6 agrega el
 * filtro para poder repasar aprobadas/rechazadas/resueltas/todas. */
export function listarNovedadesAbiertas(accessToken: string, estado?: EstadoNovedadAdmin) {
  const query = estado ? `?estado=${estado}` : '';
  return apiClient.get(`/admin/novedades${query}`, { accessToken }) as Promise<NovedadAbierta[]>;
}

/** HU-07 — marca una novedad como atendida. No toca el estado del pedido. */
export function resolverNovedad(accessToken: string, novedadId: string) {
  return apiClient.post(`/admin/novedades/${novedadId}/resolver`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** HU-07 (ronda 3) — aplica los `datosPropuestos` de una novedad tipo
 * 'edicion' al pedido y cierra la novedad. */
export function aprobarEdicionNovedad(accessToken: string, novedadId: string) {
  return apiClient.post(`/admin/novedades/${novedadId}/aprobar-edicion`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** HU-07 (ronda 3) — cierra una novedad tipo 'edicion' sin tocar el pedido. */
export function rechazarEdicionNovedad(accessToken: string, novedadId: string) {
  return apiClient.post(`/admin/novedades/${novedadId}/rechazar-edicion`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** HU-07 (ronda 3) — genera un código de entrega nuevo para el pedido. */
export function regenerarCodigoEntrega(accessToken: string, pedidoId: string) {
  return apiClient.post(`/admin/pedidos/${pedidoId}/regenerar-codigo`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado & { codigoEntrega: string }>;
}

/** HU-07 (ronda 3) — reenvía por correo el código de entrega vigente
 * (sin regenerarlo). */
export function reenviarCodigoEntregaCorreo(accessToken: string, pedidoId: string) {
  return apiClient.post(`/admin/pedidos/${pedidoId}/reenviar-codigo-correo`, undefined, {
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
