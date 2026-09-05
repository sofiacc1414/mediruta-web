import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { listarNovedadesAbiertas, type NovedadAbierta, type TipoNovedad } from '../api/pedidosAdminApi';
import { NovedadDetalle } from './NovedadDetalle';
import './NovedadesTab.css';

const ETIQUETAS_TIPO: Record<TipoNovedad, string> = {
  pregunta: 'Pregunta',
  edicion: 'Edición',
  codigo: 'Código',
};

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

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    listarNovedadesAbiertas(estado.accessToken)
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

        {error ? <Alert tono="error">{error}</Alert> : null}

        {novedades === null && !error ? <p className="admin-muted">Cargando…</p> : null}

        {novedades?.length === 0 ? (
          <div className="lp-novedades-vacio">
            <h3>¡Todo en orden!</h3>
            <p>No hay novedades pendientes de atender.</p>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {novedades?.map((novedad) => (
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
              <span className="lp-novedades-fila-fecha">{formatearFechaHora(novedad.creadoEn)}</span>
              <span className="lp-novedades-fila-chevron">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
