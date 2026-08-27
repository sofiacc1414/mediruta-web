import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { AlertTriangleIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { EstadoPedidoPill } from '../components/EstadoPedidoPill';
import {
  listarNovedadesAbiertas,
  listarPedidosAdmin,
  resolverNovedad,
  type EstadoPedido,
  type FiltrosPedidos,
  type NovedadAbierta,
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
 * "Pedidos" — novedades abiertas (para atender primero) + lista
 * filtrable de todos los pedidos reales. Estado (filtros aplicados,
 * lista ya cargada) sobrevive cambiar de tab y volver — ver
 * `AdminShell`.
 */
export function PedidosTab() {
  const { estado } = useAuth();

  const [novedades, setNovedades] = useState<NovedadAbierta[] | null>(null);
  const [errorNovedades, setErrorNovedades] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState<string | null>(null);

  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosPedidos>({});
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const [pedidos, setPedidos] = useState<PedidoAdmin[] | null>(null);
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const cargarNovedades = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorNovedades(null);
    listarNovedadesAbiertas(estado.accessToken)
      .then(setNovedades)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorNovedades(err.message);
        } else {
          throw err;
        }
      });
  }, [estado]);

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
    if (novedades === null) cargarNovedades();
    if (pedidos === null) cargarPedidos(filtrosAplicados);
    // Solo al montar la sección — cambios posteriores los disparan las
    // acciones explícitas (filtrar, resolver), no este efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;

  async function onResolver(novedadId: string) {
    if (estado.tipo !== 'autenticado') return;
    setResolviendo(novedadId);
    setErrorNovedades(null);
    try {
      await resolverNovedad(estado.accessToken, novedadId);
      cargarNovedades();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setErrorNovedades(err.message);
      } else {
        throw err;
      }
    } finally {
      setResolviendo(null);
    }
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
      <div>
        <h1>Pedidos</h1>
        <p style={{ color: 'var(--color-teal)' }}>Seguimiento de todos los pedidos y sus novedades.</p>
      </div>

      <section
        style={{
          background: 'var(--color-white)',
          borderRadius: 16,
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: 22, height: 22, color: 'var(--color-navy)' }}>
            <AlertTriangleIcon />
          </div>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>
            Novedades abiertas {novedades ? `(${novedades.length})` : ''}
          </h2>
        </div>

        {errorNovedades ? <Alert tono="error">{errorNovedades}</Alert> : null}

        {novedades === null && !errorNovedades ? (
          <p style={{ color: 'var(--color-teal)' }}>Cargando…</p>
        ) : null}

        {novedades?.length === 0 ? (
          <p style={{ color: 'var(--color-teal)' }}>No hay novedades pendientes de atender.</p>
        ) : null}

        {novedades?.map((novedad) => (
          <div
            key={novedad.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 12,
              border: '1.5px solid var(--color-sky-blue)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {novedad.codigoPedido ?? 'Pedido'} — {novedad.detalle}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-teal)' }}>
                Reportada por {novedad.reportadaPorCorreo} el {formatearFechaHora(novedad.creadoEn)}
              </div>
            </div>
            <Button
              variante="secondary"
              style={{ width: 'auto', flexShrink: 0 }}
              onClick={() => onResolver(novedad.id)}
              disabled={resolviendo === novedad.id}
            >
              {resolviendo === novedad.id ? 'Resolviendo…' : 'Resolver'}
            </Button>
          </div>
        ))}
      </section>

      <section
        style={{
          background: 'var(--color-white)',
          borderRadius: 16,
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Todos los pedidos</h2>

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
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              style={inputEstilo}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-navy)' }}>
            Hasta
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              style={inputEstilo}
            />
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

        {errorPedidos ? <Alert tono="error">{errorPedidos}</Alert> : null}

        {cargandoPedidos ? <p style={{ color: 'var(--color-teal)' }}>Cargando…</p> : null}

        {!cargandoPedidos && pedidos?.length === 0 ? (
          <p style={{ color: 'var(--color-teal)' }}>Ningún pedido coincide con estos filtros.</p>
        ) : null}

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 560 }}>
            {pedidos?.map((pedido) => (
              <div
                key={pedido.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 1fr 150px 140px',
                  gap: 'var(--space-3)',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 12,
                  border: '1px solid var(--color-sky-blue)',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ fontWeight: 700 }}>{pedido.codigoPedido}</span>
                <span>
                  {pedido.pacienteNombre ?? pedido.pacienteCorreo}
                  <br />
                  <span style={{ color: 'var(--color-teal)', fontSize: '0.8rem' }}>{pedido.direccionEntrega ?? '—'}</span>
                </span>
                <span>
                  {pedido.domiciliarioNombre ?? pedido.domiciliarioCorreo ?? '— sin asignar —'}
                </span>
                <EstadoPedidoPill estado={pedido.estado} />
                <span style={{ color: 'var(--color-teal)' }}>{formatearFechaHora(pedido.creadoEn)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
