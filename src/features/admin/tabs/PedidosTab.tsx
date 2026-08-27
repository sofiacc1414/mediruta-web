import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  actualizarConfiguracionAdmin,
  obtenerConfiguracionAdmin,
} from '../api/configuracionAdminApi';
import { EstadoPedidoPill } from '../components/EstadoPedidoPill';
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

const OPCIONES_ESTADO: { value: EstadoPedido | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente_revision', label: 'Pedido generado' },
  { value: 'en_asignacion', label: 'Buscando domiciliario' },
  { value: 'asignado_en_camino_farmacia', label: 'En camino a la farmacia' },
  { value: 'medicamentos_recogidos', label: 'Medicamentos recogidos' },
  { value: 'en_camino_entrega', label: 'En camino de entrega' },
  { value: 'en_sitio', label: 'En el sitio' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelada', label: 'Cancelada' },
];

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatearFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Minutos transcurridos desde `desde`, formateados como "Xh Ym" o "Ym". */
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

const inputEstilo = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  padding: '10px 14px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-navy)',
  background: 'var(--color-beige)',
  color: 'var(--color-navy)',
};

/** Pill de alarma — nunca rojo/naranja, dentro de la paleta oficial:
 * outline navy + ícono, el texto ya comunica la urgencia. */
function AlarmaDemora({ desdeIso }: { desdeIso: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        border: '1.5px solid var(--color-navy)',
        background: 'var(--color-beige)',
        color: 'var(--color-navy)',
        fontSize: '0.7rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      ⚠ Demorado hace {formatearDuracion(desdeIso)}
    </span>
  );
}

/**
 * "Pedidos" — lista filtrable de todos los pedidos reales, con
 * detalle completo por pedido (datos, medicamentos, tracking, cédula
 * del paciente). Lista + detalle en un componente con estado local
 * (`vista`), mismo criterio que `DomiciliariosTab`. Las novedades
 * tienen su propia pestaña (`NovedadesTab`).
 */
export function PedidosTab() {
  const { estado } = useAuth();
  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'detalle'; id: string }>({
    tipo: 'lista',
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosPedidos>({});
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [filtroDomiciliario, setFiltroDomiciliario] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (estado.tipo !== 'autenticado') return;
    obtenerConfiguracionAdmin(estado.accessToken)
      .then((c) => setUmbralMinutos(c.umbralDemoraAsignacionMinutos))
      .catch(() => {
        // Si no se pudo leer el umbral, simplemente no se muestra la
        // alarma — no es motivo para romper la pantalla de pedidos.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      desde: filtroDesde ? new Date(filtroDesde).toISOString() : undefined,
      hasta: filtroHasta ? new Date(`${filtroHasta}T23:59:59`).toISOString() : undefined,
      busqueda: filtroBusqueda.trim() || undefined,
      pacienteBusqueda: filtroPaciente.trim() || undefined,
      domiciliarioBusqueda: filtroDomiciliario.trim() || undefined,
    };
    setFiltrosAplicados(filtros);
    cargarPedidos(filtros);
  }

  function onLimpiarFiltros() {
    setFiltroEstado('');
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroBusqueda('');
    setFiltroPaciente('');
    setFiltroDomiciliario('');
    setFiltrosAplicados({});
    cargarPedidos({});
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <h1>Pedidos</h1>
        <p>Ver y filtrar todos los pedidos, con seguimiento completo de cada uno.</p>
      </div>

      <ConfiguracionUmbral umbralMinutos={umbralMinutos} onActualizado={setUmbralMinutos} />

      <section className="admin-card">
        <form
          onSubmit={onFiltrar}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}
        >
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ ...inputEstilo, minWidth: 200 }}
          >
            {OPCIONES_ESTADO.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-navy)' }}>
            Desde
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} style={inputEstilo} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-navy)' }}>
            Hasta
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} style={inputEstilo} />
          </label>
          <input
            type="search"
            placeholder="Código, nombre o correo del paciente"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            style={{ ...inputEstilo, flex: 1, minWidth: 220 }}
          />
          <input
            type="search"
            placeholder="Filtrar por paciente"
            value={filtroPaciente}
            onChange={(e) => setFiltroPaciente(e.target.value)}
            style={{ ...inputEstilo, minWidth: 180 }}
          />
          <input
            type="search"
            placeholder="Filtrar por domiciliario"
            value={filtroDomiciliario}
            onChange={(e) => setFiltroDomiciliario(e.target.value)}
            style={{ ...inputEstilo, minWidth: 180 }}
          />
          <Button type="submit" style={{ width: 'auto' }} disabled={cargandoPedidos}>
            Filtrar
          </Button>
          <Button type="button" variante="secondary" style={{ width: 'auto' }} onClick={onLimpiarFiltros}>
            Limpiar
          </Button>
        </form>
      </section>

      {errorPedidos ? <Alert tono="error">{errorPedidos}</Alert> : null}

      {cargandoPedidos ? <p className="admin-muted">Cargando…</p> : null}

      {!cargandoPedidos && pedidos?.length === 0 ? (
        <div className="admin-card admin-empty">Ningún pedido coincide con estos filtros.</div>
      ) : null}

      {pedidos && pedidos.length > 0 ? (
        <div className="admin-card admin-table-wrap" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Paciente</th>
                <th>Domiciliario</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr
                  key={pedido.id}
                  className="admin-table-row-clickable admin-table-row-button"
                  onClick={() => setVista({ tipo: 'detalle', id: pedido.id })}
                >
                  <td style={{ fontWeight: 700 }}>{pedido.codigoPedido}</td>
                  <td>
                    {pedido.pacienteNombre ?? pedido.pacienteCorreo}
                    <div className="admin-muted">{pedido.direccionEntrega ?? '—'}</div>
                  </td>
                  <td>{pedido.domiciliarioNombre ?? pedido.domiciliarioCorreo ?? '— sin asignar —'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <EstadoPedidoPill estado={pedido.estado} />
                      {estaDemorado(pedido, umbralMinutos) && pedido.enAsignacionDesde ? (
                        <AlarmaDemora desdeIso={pedido.enAsignacionDesde} />
                      ) : null}
                    </div>
                  </td>
                  <td className="admin-muted">{formatearFecha(pedido.creadoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

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
    <section className="admin-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
      {editando ? (
        <form onSubmit={onGuardar} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <label style={{ fontSize: '0.9rem' }}>
            Alertar si un pedido lleva más de{' '}
            <input
              type="number"
              min={1}
              max={1440}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              style={{ ...inputEstilo, width: 80, textAlign: 'center' }}
              autoFocus
            />{' '}
            minutos sin domiciliario
          </label>
          <Button type="submit" style={{ width: 'auto' }} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" variante="secondary" style={{ width: 'auto' }} onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <>
          <span style={{ fontSize: '0.9rem' }}>
            Alarma de pedido demorado:{' '}
            <strong>
              {umbralMinutos === null ? 'cargando…' : `más de ${umbralMinutos} min sin domiciliario`}
            </strong>
          </span>
          <Button
            type="button"
            variante="secondary"
            style={{ width: 'auto' }}
            onClick={() => {
              setValor(String(umbralMinutos ?? 15));
              setEditando(true);
            }}
          >
            Cambiar umbral
          </Button>
        </>
      )}
      {error ? <Alert tono="error">{error}</Alert> : null}
    </section>
  );
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <button type="button" className="admin-back-link" onClick={onVolver}>
        ← Volver a pedidos
      </button>

      {error ? <Alert tono="error">{error}</Alert> : null}
      {!detalle && !error ? <p className="admin-muted">Cargando…</p> : null}

      {detalle ? (
        <>
          <div className="admin-card-header">
            <div>
              <h1 style={{ marginBottom: 4 }}>{detalle.codigoPedido}</h1>
              <span className="admin-muted">Creado el {formatearFechaHora(detalle.creadoEn)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <EstadoPedidoPill estado={detalle.estado} />
              {demorado && detalle.enAsignacionDesde ? <AlarmaDemora desdeIso={detalle.enAsignacionDesde} /> : null}
            </div>
          </div>

          {detalle.novedadAbierta ? (
            <Alert tono="info">
              Novedad sin resolver: {detalle.novedadAbierta.detalle} (
              {formatearFechaHora(detalle.novedadAbierta.creadoEn)})
            </Alert>
          ) : null}

          {detalle.estado === 'en_asignacion' ? (
            <AsignarDomiciliarioCard
              pedidoId={detalle.id}
              onAsignado={() => {
                cargar();
                onAsignado();
              }}
            />
          ) : null}

          {detalle.codigoEntrega ? (
            <div
              className="admin-card"
              style={{ background: 'var(--color-navy)', color: 'var(--color-white)' }}
            >
              <span style={{ color: 'var(--color-sky-blue)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                CÓDIGO DE ENTREGA
              </span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.15em' }}>
                {detalle.codigoEntrega}
              </span>
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            <section className="admin-card">
              <h2>Paciente</h2>
              <p>{detalle.paciente.nombre ?? '—'}</p>
              <p className="admin-muted">{detalle.paciente.correo}</p>
              <p className="admin-muted">{detalle.paciente.telefono ?? 'Sin teléfono'}</p>
              <p style={{ marginTop: 4 }}>Dirección de entrega: {detalle.direccionEntrega ?? '—'}</p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 4 }}>
                <MiniaturaDoc etiqueta="Cédula (frente)" url={detalle.paciente.cedulaFrenteUrl} />
                <MiniaturaDoc etiqueta="Cédula (reverso)" url={detalle.paciente.cedulaReversoUrl} />
              </div>
            </section>

            <section className="admin-card">
              <h2>Domiciliario</h2>
              {detalle.domiciliario ? (
                <>
                  <p>{detalle.domiciliario.nombre ?? '—'}</p>
                  <p className="admin-muted">{detalle.domiciliario.correo}</p>
                  <p className="admin-muted">{detalle.domiciliario.telefono ?? 'Sin teléfono'}</p>
                </>
              ) : (
                <p className="admin-muted">Todavía sin asignar.</p>
              )}
              <p style={{ marginTop: 4 }}>Farmacia: {detalle.direccionFarmacia ?? '—'}</p>
            </section>
          </div>

          <section className="admin-card">
            <h2>Medicamentos</h2>
            {detalle.medicamentos.length === 0 ? (
              <p className="admin-muted">Ninguno cargado.</p>
            ) : (
              detalle.medicamentos.map((m, i) => (
                <div key={i} style={{ paddingBottom: 'var(--space-2)', borderBottom: i < detalle.medicamentos.length - 1 ? '1px solid var(--color-sky-blue)' : 'none' }}>
                  <strong>{m.nombre ?? 'Sin nombre'}</strong>{' '}
                  <span className="admin-muted">
                    {[m.concentracion, m.formaFarmaceutica, m.cantidad].filter(Boolean).join(' · ')}
                  </span>
                  {m.posologia ? <div className="admin-muted">Posología: {m.posologia}</div> : null}
                </div>
              ))
            )}
            <MiniaturaDoc etiqueta="Foto de la receta" url={detalle.recetaUrl} />
          </section>

          <section className="admin-card">
            <h2>Seguimiento</h2>
            <TrackingTimeline estadoActual={detalle.estado} historial={detalle.historial} />
            {detalle.estado === 'cancelada' ? (
              <p className="admin-muted">Este pedido fue cancelado.</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}

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
    <section className="admin-card">
      <div className="admin-card-header">
        <h2 style={{ margin: 0 }}>Asignar domiciliario</h2>
        {!abierto ? (
          <Button type="button" style={{ width: 'auto' }} onClick={onAbrir}>
            Ver domiciliarios cercanos
          </Button>
        ) : (
          <Button type="button" variante="secondary" style={{ width: 'auto' }} onClick={() => setAbierto(false)}>
            Cerrar
          </Button>
        )}
      </div>

      {abierto ? (
        <>
          {error ? <Alert tono="error">{error}</Alert> : null}
          {cercanos === null && !error ? <p className="admin-muted">Buscando domiciliarios disponibles…</p> : null}
          {cercanos?.length === 0 ? (
            <p className="admin-muted">No hay domiciliarios disponibles cerca de esta farmacia en este momento.</p>
          ) : null}
          {cercanos && cercanos.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Distancia</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cercanos.map((d) => (
                    <tr key={d.usuarioId}>
                      <td>{d.nombreCompleto ?? 'Sin nombre'}</td>
                      <td className="admin-muted">{d.telefono ?? '—'}</td>
                      <td className="admin-muted">{(d.distanciaMetros / 1000).toFixed(1)} km</td>
                      <td>
                        <Button
                          type="button"
                          style={{ width: 'auto' }}
                          disabled={asignando === d.usuarioId}
                          onClick={() => onAsignar(d.usuarioId)}
                        >
                          {asignando === d.usuarioId ? 'Asignando…' : 'Asignar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function MiniaturaDoc({ etiqueta, url }: { etiqueta: string; url: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="admin-muted">{etiqueta}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={etiqueta}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-sky-blue)' }}
          />
        </a>
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--color-sky-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-teal)',
            fontSize: '0.7rem',
            textAlign: 'center',
          }}
        >
          No subida
        </div>
      )}
    </div>
  );
}
