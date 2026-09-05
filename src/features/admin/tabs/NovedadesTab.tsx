import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  listarNovedadesAbiertas,
  type EstadoNovedadAdmin,
  type NovedadAbierta,
  type TipoNovedad,
} from '../api/pedidosAdminApi';
import { NovedadDetalle } from './NovedadDetalle';
import './NovedadesTab.css';

const ETIQUETAS_TIPO: Record<TipoNovedad, string> = {
  pregunta: 'Pregunta',
  edicion: 'Edición',
  codigo: 'Código',
};

/** HU-07 (ronda 6) — tarjetas de métrica por estado, mismo patrón (y
 * misma dinámica de click-para-filtrar) que las de la pestaña Pedidos:
 * se trae todo una sola vez (`estado=todas`) y tanto los conteos como el
 * filtro por tarjeta se resuelven en el cliente sobre esa lista — nada
 * de un roundtrip al backend por cada click. */
const TARJETAS_ESTADO: { value: EstadoNovedadAdmin; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'abierta', label: 'Abiertas' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'resuelta', label: 'Resueltas' },
];

/** Estado real de una novedad, igual al valor de `EstadoNovedadAdmin`
 * salvo 'todas' (que no es un estado, es "sin filtrar"). */
function estadoDeNovedad(novedad: NovedadAbierta): Exclude<EstadoNovedadAdmin, 'todas'> {
  if (!novedad.resuelta) return 'abierta';
  if (novedad.accionEdicion === 'aprobada') return 'aprobada';
  if (novedad.accionEdicion === 'rechazada') return 'rechazada';
  return 'resuelta';
}

function etiquetaEstado(novedad: NovedadAbierta): string {
  switch (estadoDeNovedad(novedad)) {
    case 'abierta':
      return '⏳ Abierta';
    case 'aprobada':
      return '✓ Aprobada';
    case 'rechazada':
      return '✕ Rechazada';
    case 'resuelta':
      return '✓ Resuelta';
  }
}

function formatearFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Vista = { tipo: 'lista' } | { tipo: 'detalle'; novedad: NovedadAbierta };

/** "Novedades" — lo que el Paciente/Domiciliario reporta sobre un
 * pedido en curso, todavía sin atender (HU-07). Pestaña propia,
 * separada de Pedidos — es lo primero que un admin necesita atender
 * al entrar al panel.
 *
 * Lista liviana a propósito (solo código + tipo + una línea de detalle
 * — nada de imágenes/diff/botones acá): con muchos casos abiertos a la
 * vez, pintar cada uno como tarjeta completa se vuelve pesado. Click
 * en una fila abre el detalle completo (`NovedadDetalle`) en el mismo
 * lugar — mismo patrón `vista: {tipo:'lista'}|{tipo:'detalle'}` que ya
 * usan Pedidos/Domiciliarios/Usuarios, no un sistema de pestañas
 * nuevo.
 */
export function NovedadesTab() {
  const { estado } = useAuth();
  const [novedades, setNovedades] = useState<NovedadAbierta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const [filtroTarjeta, setFiltroTarjeta] = useState<EstadoNovedadAdmin>('abierta');

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    listarNovedadesAbiertas(estado.accessToken, 'todas')
      .then(setNovedades)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado]);

  useEffect(() => {
    if (novedades === null) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;

  if (vista.tipo === 'detalle') {
    return (
      <NovedadDetalle
        novedad={vista.novedad}
        onVolver={() => setVista({ tipo: 'lista' })}
        onResuelta={() => {
          setVista({ tipo: 'lista' });
          cargar();
        }}
      />
    );
  }

  const conteos: Record<EstadoNovedadAdmin, number> = {
    todas: novedades?.length ?? 0,
    abierta: 0,
    aprobada: 0,
    rechazada: 0,
    resuelta: 0,
  };
  novedades?.forEach((n) => conteos[estadoDeNovedad(n)]++);

  const novedadesMostradas =
    filtroTarjeta === 'todas' ? novedades : novedades?.filter((n) => estadoDeNovedad(n) === filtroTarjeta);

  return (
    <div className="lp-novedades-wrapper">
      {/* ===== ÍCONO LATERAL ===== */}
      <div className="lp-novedades-icon-side">
        <img src="/images/Novedades.png" alt="Novedades" className="lp-novedades-icon-img" />
      </div>

      <div className="lp-novedades-content">
        <div className="lp-novedades-header">
          <div className="lp-novedades-header-left">
            <h1 className="lp-novedades-title">Novedades</h1>
            <p className="lp-novedades-subtitle">
              Lo que pacientes y domiciliarios reportan sobre un pedido en curso.
            </p>
          </div>
        </div>

        {/* HU-07 (ronda 6) — tarjetas de estado con conteo, misma dinámica
         * que Pedidos: se trae todo una vez y el click filtra en el
         * cliente (ver `cargar`/`novedadesMostradas` arriba). */}
        <div className="lp-novedades-stats">
          {TARJETAS_ESTADO.map((tarjeta) => (
            <button
              key={tarjeta.value}
              type="button"
              className={`lp-novedades-stat${filtroTarjeta === tarjeta.value ? ' lp-novedades-stat--activa' : ''}`}
              onClick={() => setFiltroTarjeta(tarjeta.value)}
            >
              <span className="lp-novedades-stat-number">{conteos[tarjeta.value]}</span>
              <span className="lp-novedades-stat-label">{tarjeta.label}</span>
            </button>
          ))}
        </div>

        {error ? <Alert tono="error">{error}</Alert> : null}

        {novedades === null && !error ? <p className="admin-muted">Cargando…</p> : null}

        {novedadesMostradas?.length === 0 ? (
          <div className="lp-novedades-vacio">
            <h3>¡Todo en orden!</h3>
            <p>No hay novedades en este estado.</p>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {novedadesMostradas?.map((novedad) => (
            <button
              key={novedad.id}
              type="button"
              className="lp-novedades-fila"
              onClick={() => setVista({ tipo: 'detalle', novedad })}
            >
              <span className="lp-novedades-fila-codigo">{novedad.codigoPedido ?? 'Pedido'}</span>
              <span className={`admin-tag admin-tag--${novedad.tipo}`}>
                {ETIQUETAS_TIPO[novedad.tipo]}
              </span>
              <span className="lp-novedades-fila-detalle">{novedad.detalle}</span>
              <span className="lp-novedades-fila-estado">{etiquetaEstado(novedad)}</span>
              <span className="lp-novedades-fila-fecha">{formatearFechaHora(novedad.creadoEn)}</span>
              <span className="lp-novedades-fila-chevron">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
