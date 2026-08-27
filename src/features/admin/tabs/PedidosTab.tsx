import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { EstadoPedidoPill } from '../components/EstadoPedidoPill';
import { TrackingTimeline } from '../components/TrackingTimeline';
import {
  listarPedidosAdmin,
  obtenerDetallePedidoAdmin,
  type DetallePedidoAdmin,
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

const inputEstilo = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid var(--color-navy)',
  background: 'var(--color-beige)',
  color: 'var(--color-navy)',
};

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

  const [pedidos, setPedidos] = useState<PedidoAdmin[] | null>(null);
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

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

  if (estado.tipo !== 'autenticado') return null;

  if (vista.tipo === 'detalle') {
    return <PedidoDetalle pedidoId={vista.id} onVolver={() => setVista({ tipo: 'lista' })} />;
  }

  function onFiltrar(evento: FormEvent) {
    evento.preventDefault();
    const filtros: FiltrosPedidos = {
      estado: (filtroEstado || undefined) as EstadoPedido | undefined,
      desde: filtroDesde ? new Date(filtroDesde).toISOString() : undefined,
      hasta: filtroHasta ? new Date(`${filtroHasta}T23:59:59`).toISOString() : undefined,
      busqueda: filtroBusqueda.trim() || undefined,
    };
    setFiltrosAplicados(filtros);
    cargarPedidos(filtros);
  }

  function onLimpiarFiltros() {
    setFiltroEstado('');
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroBusqueda('');
    setFiltrosAplicados({});
    cargarPedidos({});
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <h1>Pedidos</h1>
        <p>Ver y filtrar todos los pedidos, con seguimiento completo de cada uno.</p>
      </div>

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
                    <EstadoPedidoPill estado={pedido.estado} />
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

function PedidoDetalle({ pedidoId, onVolver }: { pedidoId: string; onVolver: () => void }) {
  const { estado } = useAuth();
  const [detalle, setDetalle] = useState<DetallePedidoAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  if (estado.tipo !== 'autenticado') return null;

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
            <EstadoPedidoPill estado={detalle.estado} />
          </div>

          {detalle.novedadAbierta ? (
            <Alert tono="info">
              Novedad sin resolver: {detalle.novedadAbierta.detalle} (
              {formatearFechaHora(detalle.novedadAbierta.creadoEn)})
            </Alert>
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

function MiniaturaDoc({ etiqueta, url }: { etiqueta: string; url: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="admin-muted">{etiqueta}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={etiqueta}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-sky-blue)' }}
          />
        </a>
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
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
