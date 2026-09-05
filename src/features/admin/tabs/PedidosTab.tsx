import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  actualizarConfiguracionAdmin,
  obtenerConfiguracionAdmin,
} from '../api/configuracionAdminApi';
import { EstadoPedidoPill } from '../components/EstadoPedidoPill';
import { DomiciliarioCard, MedicamentosRecetaCard, PacienteCard } from '../components/PedidoResumenCards';
import { TrackingTimeline } from '../components/TrackingTimeline';
import {
  asignarDomiciliario,
  listarDomiciliariosCercanos,
  listarPedidosAdmin,
  obtenerDetallePedidoAdmin,
  type DetallePedidoAdmin,
  type DomiciliarioCercano,
  type EstadoPedido,
  type FiltrosPedidos,
  type PedidoAdmin,
} from '../api/pedidosAdminApi';
import './PedidosTab.css';

const OPCIONES_ESTADO: { value: EstadoPedido | ''; label: string; color: string }[] = [
  { value: '', label: 'Todos', color: '#6b7280' },
  { value: 'pendiente_revision', label: 'Generado', color: '#f59e0b' },
  { value: 'en_asignacion', label: 'Buscando', color: '#8b5cf6' },
  { value: 'asignado_en_camino_farmacia', label: 'A farmacia', color: '#3b82f6' },
  { value: 'medicamentos_recogidos', label: 'Recogido', color: '#06b6d4' },
  { value: 'en_camino_entrega', label: 'En camino', color: '#6366f1' },
  { value: 'en_sitio', label: 'En sitio', color: '#22c55e' },
  { value: 'entregado', label: 'Entregado', color: '#22c55e' },
  { value: 'cancelada', label: 'Cancelada', color: '#ef4444' },
];

function formatearFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearDuracion(desdeIso: string): string {
  const minutos = Math.floor((Date.now() - new Date(desdeIso).getTime()) / 60000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas}h ${resto}min`;
}

function estaDemorado(
  pedido: Pick<PedidoAdmin, 'estado' | 'enAsignacionDesde'>,
  umbralMinutos: number | null,
): boolean {
  if (!umbralMinutos || pedido.estado !== 'en_asignacion' || !pedido.enAsignacionDesde) return false;
  const minutos = (Date.now() - new Date(pedido.enAsignacionDesde).getTime()) / 60000;
  return minutos > umbralMinutos;
}

function AlarmaDemora({ desdeIso }: { desdeIso: string }) {
  return (
    <span className="lp-alarma-demora">
      ⚠️ {formatearDuracion(desdeIso)}
    </span>
  );
}

export function PedidosTab() {
  const { estado } = useAuth();
  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'detalle'; id: string }>({
    tipo: 'lista',
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosPedidos>({});
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  /** Tarjeta de métrica seleccionada (Total/Pendientes/En camino/Entregados)
   * — filtra sobre lo ya cargado, en el cliente: "Pendientes" y "En camino"
   * agrupan 2 estados cada uno, y la API de pedidos solo filtra por un
   * único `estado`, así que no vale la pena un roundtrip nuevo por esto. */
  const [filtroTarjeta, setFiltroTarjeta] = useState<
    'total' | 'pendientes' | 'en_camino' | 'entregados' | 'cancelados'
  >('total');

  const [pedidos, setPedidos] = useState<PedidoAdmin[] | null>(null);
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const [umbralMinutos, setUmbralMinutos] = useState<number | null>(null);

  const cargarPedidos = useCallback(
    (filtros: FiltrosPedidos) => {
      if (estado.tipo !== 'autenticado') return;
      setCargandoPedidos(true);
      setErrorPedidos(null);
      listarPedidosAdmin(estado.accessToken, filtros)
        .then(setPedidos)
        .catch((err: unknown) => {
          if (err instanceof ApiError || err instanceof ApiSinConexionError) {
            setErrorPedidos(err.message);
          } else {
            throw err;
          }
        })
        .finally(() => setCargandoPedidos(false));
    },
    [estado],
  );

  useEffect(() => {
    if (pedidos === null) cargarPedidos(filtrosAplicados);
  }, []);

  useEffect(() => {
    if (estado.tipo !== 'autenticado') return;
    obtenerConfiguracionAdmin(estado.accessToken)
      .then((c) => setUmbralMinutos(c.umbralDemoraAsignacionMinutos))
      .catch(() => {});
  }, []);

  if (estado.tipo !== 'autenticado') return null;

  if (vista.tipo === 'detalle') {
    return (
      <PedidoDetalle
        pedidoId={vista.id}
        umbralMinutos={umbralMinutos}
        onVolver={() => setVista({ tipo: 'lista' })}
        onAsignado={() => cargarPedidos(filtrosAplicados)}
      />
    );
  }

  function onFiltrar(evento: FormEvent) {
    evento.preventDefault();
    const filtros: FiltrosPedidos = {
      estado: (filtroEstado || undefined) as EstadoPedido | undefined,
      busqueda: filtroBusqueda.trim() || undefined,
    };
    setFiltrosAplicados(filtros);
    cargarPedidos(filtros);
  }

  function onLimpiarFiltros() {
    setFiltroEstado('');
    setFiltroBusqueda('');
    setFiltrosAplicados({});
    cargarPedidos({});
  }

  // Las 4 tarjetas deben partir el universo completo de estados que trae
  // `listarPedidosAdmin` (todos salvo 'borrador', que ni siquiera llega acá
  // — el backend solo devuelve pedidos ya enviados, con código asignado).
  // Antes "en_camino" solo cubría 2 de los 4 estados intermedios y no
  // existía una tarjeta para "cancelada", así que el Total nunca coincidía
  // con la suma de las demás tarjetas.
  function grupoDelPedido(
    p: Pick<PedidoAdmin, 'estado'>,
  ): 'pendientes' | 'en_camino' | 'entregados' | 'cancelados' {
    if (p.estado === 'pendiente_revision' || p.estado === 'en_asignacion') return 'pendientes';
    if (p.estado === 'entregado') return 'entregados';
    if (p.estado === 'cancelada') return 'cancelados';
    // asignado_en_camino_farmacia | medicamentos_recogidos | en_camino_entrega | en_sitio
    return 'en_camino';
  }

  const total = pedidos?.length || 0;
  const pendientes = pedidos?.filter((p) => grupoDelPedido(p) === 'pendientes').length || 0;
  const enCamino = pedidos?.filter((p) => grupoDelPedido(p) === 'en_camino').length || 0;
  const entregados = pedidos?.filter((p) => grupoDelPedido(p) === 'entregados').length || 0;
  const cancelados = pedidos?.filter((p) => grupoDelPedido(p) === 'cancelados').length || 0;

  const pedidosMostrados =
    filtroTarjeta === 'total' ? pedidos : pedidos?.filter((p) => grupoDelPedido(p) === filtroTarjeta);

  return (
    <div className="lp-pedidos-wrapper">

      {/* ===== ÍCONO LATERAL (transparente, sin marco) ===== */}
      <div className="lp-pedidos-icon-side">
        <img 
          src="/images/Pedidos.png" 
          alt="Pedidos"
          className="lp-pedidos-icon-img"
        />
      </div>

      <div className="lp-pedidos-content">

        {/* HEADER CON TÍTULO */}
        <div className="lp-pedidos-header">
          <div className="lp-pedidos-header-left">
            <h1 className="lp-pedidos-title">Pedidos</h1>
            <p className="lp-pedidos-subtitle">Visualiza y gestiona todos los pedidos de MediRuta</p>
          </div>
          <div className="lp-pedidos-header-right">
            <ConfiguracionUmbral umbralMinutos={umbralMinutos} onActualizado={setUmbralMinutos} />
          </div>
        </div>

        {/* ESTADÍSTICAS — clicables, filtran la lista de abajo (en el cliente) */}
        <div className="lp-pedidos-stats">
          <button
            type="button"
            className={`lp-pedidos-stat${filtroTarjeta === 'total' ? ' lp-pedidos-stat--activa' : ''}`}
            onClick={() => setFiltroTarjeta('total')}
          >
            <span className="lp-pedidos-stat-number">{total}</span>
            <span className="lp-pedidos-stat-label">Total</span>
          </button>
          <button
            type="button"
            className={`lp-pedidos-stat lp-pedidos-stat-pendiente${filtroTarjeta === 'pendientes' ? ' lp-pedidos-stat--activa' : ''}`}
            onClick={() => setFiltroTarjeta('pendientes')}
          >
            <span className="lp-pedidos-stat-number">{pendientes}</span>
            <span className="lp-pedidos-stat-label">Pendientes</span>
          </button>
          <button
            type="button"
            className={`lp-pedidos-stat lp-pedidos-stat-camino${filtroTarjeta === 'en_camino' ? ' lp-pedidos-stat--activa' : ''}`}
            onClick={() => setFiltroTarjeta('en_camino')}
          >
            <span className="lp-pedidos-stat-number">{enCamino}</span>
            <span className="lp-pedidos-stat-label">En camino</span>
          </button>
          <button
            type="button"
            className={`lp-pedidos-stat lp-pedidos-stat-entregado${filtroTarjeta === 'entregados' ? ' lp-pedidos-stat--activa' : ''}`}
            onClick={() => setFiltroTarjeta('entregados')}
          >
            <span className="lp-pedidos-stat-number">{entregados}</span>
            <span className="lp-pedidos-stat-label">Entregados</span>
          </button>
          <button
            type="button"
            className={`lp-pedidos-stat lp-pedidos-stat-cancelado${filtroTarjeta === 'cancelados' ? ' lp-pedidos-stat--activa' : ''}`}
            onClick={() => setFiltroTarjeta('cancelados')}
          >
            <span className="lp-pedidos-stat-number">{cancelados}</span>
            <span className="lp-pedidos-stat-label">Cancelados</span>
          </button>
        </div>

        {/* FILTROS */}
        <div className="lp-pedidos-filtros">
          <form onSubmit={onFiltrar} className="lp-pedidos-filtros-form">
            <div className="lp-pedidos-filtros-grid">
              <div className="lp-pedidos-filtro-grupo">
                <label className="lp-pedidos-filtro-label">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="lp-pedidos-select"
                >
                  {OPCIONES_ESTADO.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lp-pedidos-filtro-grupo lp-pedidos-filtro-grupo-full">
                <label className="lp-pedidos-filtro-label">Buscar</label>
                <input
                  type="search"
                  placeholder="Buscar por código, paciente o domiciliario..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="lp-pedidos-input"
                />
              </div>
            </div>

            <div className="lp-pedidos-filtros-actions">
              <button type="submit" className="lp-pedidos-btn lp-pedidos-btn-primary" disabled={cargandoPedidos}>
                {cargandoPedidos ? '⏳' : '🔍'} Filtrar
              </button>
              <button type="button" className="lp-pedidos-btn lp-pedidos-btn-secondary" onClick={onLimpiarFiltros}>
                🗑️ Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* SCROLL CONTAINER */}
        <div className="lp-pedidos-scroll-container">
          {errorPedidos ? <Alert tono="error">{errorPedidos}</Alert> : null}

          {cargandoPedidos && (
            <div className="lp-pedidos-loading">
              <div className="lp-pedidos-loading-spinner" />
              <span>Cargando pedidos...</span>
            </div>
          )}

          {!cargandoPedidos && pedidosMostrados?.length === 0 && (
            <div className="lp-pedidos-empty">
              <span className="lp-pedidos-empty-icon">📭</span>
              <h3>No hay pedidos</h3>
              <p>Ningún pedido coincide con estos filtros</p>
            </div>
          )}

          {pedidosMostrados && pedidosMostrados.length > 0 && (
            <div className="lp-pedidos-list">
              {pedidosMostrados.map((pedido) => {
                const demorado = estaDemorado(pedido, umbralMinutos);
                return (
                  <div
                    key={pedido.id}
                    className="lp-pedidos-card"
                    onClick={() => setVista({ tipo: 'detalle', id: pedido.id })}
                  >
                    <div className="lp-pedidos-card-left">
                      <span className="lp-pedidos-card-codigo">{pedido.codigoPedido}</span>
                      <div className="lp-pedidos-card-paciente">
                        <div className="lp-pedidos-card-avatar">
                          {pedido.pacienteNombre?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className="lp-pedidos-card-nombre">
                            {pedido.pacienteNombre ?? pedido.pacienteCorreo}
                          </div>
                          <div className="lp-pedidos-card-direccion">
                            📍 {pedido.direccionEntrega ?? 'Sin dirección'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lp-pedidos-card-info">
                      <div className="lp-pedidos-card-info-item">
                        <span className="lp-pedidos-card-info-label">Domiciliario</span>
                        <span className="lp-pedidos-card-info-value">
                          {pedido.domiciliarioNombre ?? pedido.domiciliarioCorreo ?? (
                            <span className="lp-pedidos-card-sin-asignar">Sin asignar</span>
                          )}
                        </span>
                      </div>
                      <div className="lp-pedidos-card-info-item">
                        <span className="lp-pedidos-card-info-label">Fecha</span>
                        <span className="lp-pedidos-card-info-value">
                          {formatearFechaHora(pedido.creadoEn)}
                        </span>
                      </div>
                      {demorado && pedido.enAsignacionDesde && (
                        <div className="lp-pedidos-card-demora">
                          <AlarmaDemora desdeIso={pedido.enAsignacionDesde} />
                        </div>
                      )}
                    </div>

                    <div className="lp-pedidos-card-right">
                      <EstadoPedidoPill estado={pedido.estado} />
                      <div className="lp-pedidos-card-footer">
                        <button className="lp-pedidos-card-ver">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONFIGURACIÓN UMBRAL
// ============================================================

function ConfiguracionUmbral({
  umbralMinutos,
  onActualizado,
}: {
  umbralMinutos: number | null;
  onActualizado: (umbral: number) => void;
}) {
  const { estado } = useAuth();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;

  async function onGuardar(evento: FormEvent) {
    evento.preventDefault();
    if (estado.tipo !== 'autenticado') return;
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1) {
      setError('Ingresá un número entero de minutos, mayor a 0.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await actualizarConfiguracionAdmin(estado.accessToken, numero);
      onActualizado(numero);
      setEditando(false);
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="lp-pedidos-umbral-mini">
      {editando ? (
        <form onSubmit={onGuardar} className="lp-pedidos-umbral-mini-form">
          <span className="lp-pedidos-umbral-mini-label">⏱️</span>
          <input
            type="number"
            min={1}
            max={1440}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="lp-pedidos-umbral-mini-input"
            autoFocus
          />
          <span className="lp-pedidos-umbral-mini-label">min</span>
          <button type="submit" className="lp-pedidos-btn lp-pedidos-btn-primary" disabled={guardando}>
            💾
          </button>
          <button type="button" className="lp-pedidos-btn lp-pedidos-btn-secondary" onClick={() => setEditando(false)}>
            ✕
          </button>
          {error && <Alert tono="error">{error}</Alert>}
        </form>
      ) : (
        <button
          type="button"
          className="lp-pedidos-umbral-mini-btn"
          onClick={() => {
            setValor(String(umbralMinutos ?? 15));
            setEditando(true);
          }}
        >
          ⏱️ {umbralMinutos === null ? 'cargando…' : `${umbralMinutos} min`}
        </button>
      )}
    </div>
  );
}

// ============================================================
// DETALLE DEL PEDIDO (DISEÑO SOFISTICADO)
// ============================================================

function PedidoDetalle({
  pedidoId,
  umbralMinutos,
  onVolver,
  onAsignado,
}: {
  pedidoId: string;
  umbralMinutos: number | null;
  onVolver: () => void;
  onAsignado: () => void;
}) {
  const { estado } = useAuth();
  const [detalle, setDetalle] = useState<DetallePedidoAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    obtenerDetallePedidoAdmin(estado.accessToken, pedidoId)
      .then(setDetalle)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado, pedidoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado.tipo !== 'autenticado') return null;

  const demorado = detalle ? estaDemorado(detalle, umbralMinutos) : false;

  return (
    <div className="lp-pedidos-detalle">
      <button type="button" className="lp-pedidos-detalle-volver" onClick={onVolver}>
        ← Volver a pedidos
      </button>

      {error ? <Alert tono="error">{error}</Alert> : null}

      {!detalle && !error && (
        <div className="lp-pedidos-loading">
          <div className="lp-pedidos-loading-spinner" />
          <span>Cargando detalle...</span>
        </div>
      )}

      {detalle && (
        <>
          {/* CABECERA HERO */}
          <div className="lp-pedidos-detalle-hero">
            <div className="lp-pedidos-detalle-hero-content">
              <div className="lp-pedidos-detalle-hero-left">
                <h1 className="lp-pedidos-detalle-titulo">{detalle.codigoPedido}</h1>
                <p className="lp-pedidos-detalle-fecha">
                  Creado el {formatearFechaHora(detalle.creadoEn)}
                </p>
              </div>
              <div className="lp-pedidos-detalle-estado-wrapper">
                <EstadoPedidoPill estado={detalle.estado} />
                {demorado && detalle.enAsignacionDesde && (
                  <AlarmaDemora desdeIso={detalle.enAsignacionDesde} />
                )}
              </div>
            </div>
          </div>

          {/* CÓDIGO DE ENTREGA (Azul corporativo) */}
          {detalle.codigoEntrega && (
            <div className="lp-pedidos-detalle-codigo">
              <span className="lp-pedidos-detalle-codigo-label">🔐 CÓDIGO DE ENTREGA</span>
              <span className="lp-pedidos-detalle-codigo-valor">{detalle.codigoEntrega}</span>
            </div>
          )}

          {detalle.novedadAbierta && (
            <Alert tono="info">
              📢 Novedad sin resolver: {detalle.novedadAbierta.detalle} (
              {formatearFechaHora(detalle.novedadAbierta.creadoEn)})
            </Alert>
          )}

          {detalle.estado === 'en_asignacion' && (
            <AsignarDomiciliarioCard
              pedidoId={detalle.id}
              onAsignado={() => {
                cargar();
                onAsignado();
              }}
            />
          )}

          {/* GRID DE TARJETAS PREMIUM */}
          <div className="lp-pedidos-detalle-grid">
            <PacienteCard paciente={detalle.paciente} direccionEntrega={detalle.direccionEntrega} />
            <DomiciliarioCard
              domiciliario={detalle.domiciliario}
              direccionFarmacia={detalle.direccionFarmacia}
            />
          </div>

          {/* MEDICAMENTOS */}
          <MedicamentosRecetaCard medicamentos={detalle.medicamentos} recetaUrl={detalle.recetaUrl} />

          {/* SEGUIMIENTO */}
          <div className="lp-pedidos-detalle-seguimiento">
            <h3 className="lp-pedidos-detalle-card-titulo">📊 Seguimiento</h3>
            <TrackingTimeline estadoActual={detalle.estado} historial={detalle.historial} />
            {detalle.estado === 'cancelada' && (
              <p className="lp-pedidos-detalle-card-sin">Este pedido fue cancelado</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// ASIGNAR DOMICILIARIO
// ============================================================

function AsignarDomiciliarioCard({ pedidoId, onAsignado }: { pedidoId: string; onAsignado: () => void }) {
  const { estado } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [cercanos, setCercanos] = useState<DomiciliarioCercano[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;

  function onAbrir() {
    if (estado.tipo !== 'autenticado') return;
    setAbierto(true);
    setError(null);
    setCercanos(null);
    listarDomiciliariosCercanos(estado.accessToken, pedidoId)
      .then(setCercanos)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }

  async function onAsignar(domiciliarioId: string) {
    if (estado.tipo !== 'autenticado') return;
    setAsignando(domiciliarioId);
    setError(null);
    try {
      await asignarDomiciliario(estado.accessToken, pedidoId, domiciliarioId);
      setAbierto(false);
      onAsignado();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setAsignando(null);
    }
  }

  return (
    <div className="lp-pedidos-detalle-card lp-pedidos-asignar">
      <div className="lp-pedidos-asignar-header">
        <h3 className="lp-pedidos-detalle-card-titulo">👨‍✈️ Asignar domiciliario</h3>
        {!abierto ? (
          <button type="button" className="lp-pedidos-btn lp-pedidos-btn-primary" onClick={onAbrir}>
            Ver domiciliarios cercanos
          </button>
        ) : (
          <button type="button" className="lp-pedidos-btn lp-pedidos-btn-secondary" onClick={() => setAbierto(false)}>
            Cerrar
          </button>
        )}
      </div>

      {abierto && (
        <>
          {error && <Alert tono="error">{error}</Alert>}
          {cercanos === null && !error && (
            <div className="lp-pedidos-loading">
              <div className="lp-pedidos-loading-spinner" />
              <span>Buscando domiciliarios disponibles...</span>
            </div>
          )}
          {cercanos?.length === 0 && (
            <p className="lp-pedidos-detalle-card-sin">No hay domiciliarios disponibles cerca de esta farmacia</p>
          )}
          {cercanos && cercanos.length > 0 && (
            <div className="lp-pedidos-asignar-lista">
              {cercanos.map((d) => (
                <div key={d.usuarioId} className="lp-pedidos-asignar-item">
                  <div className="lp-pedidos-asignar-info">
                    <span className="lp-pedidos-asignar-nombre">{d.nombreCompleto ?? 'Sin nombre'}</span>
                    <span className="lp-pedidos-asignar-telefono">{d.telefono ?? '—'}</span>
                    <span className="lp-pedidos-asignar-distancia">
                      📍 {(d.distanciaMetros / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <button
                    type="button"
                    className="lp-pedidos-btn lp-pedidos-btn-primary"
                    disabled={asignando === d.usuarioId}
                    onClick={() => onAsignar(d.usuarioId)}
                  >
                    {asignando === d.usuarioId ? '⏳' : 'Asignar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

