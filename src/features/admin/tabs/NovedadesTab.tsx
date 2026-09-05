import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { listarNovedadesAbiertas, resolverNovedad, type NovedadAbierta } from '../api/pedidosAdminApi';
import './NovedadesTab.css';

const ETIQUETAS_ORIGEN: Record<NovedadAbierta['origen'], string> = {
  paciente: 'el paciente',
  domiciliario: 'el domiciliario',
};

function formatearFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "Novedades" — incidentes reportados por Domiciliarios sobre un
 * pedido en curso, todavía sin resolver (HU-07). Pestaña propia,
 * separada de Pedidos — es lo primero que un admin necesita atender
 * al entrar al panel. */
export function NovedadesTab() {
  const { estado } = useAuth();
  const [novedades, setNovedades] = useState<NovedadAbierta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState<string | null>(null);

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

  async function onResolver(novedadId: string) {
    if (estado.tipo !== 'autenticado') return;
    setResolviendo(novedadId);
    setError(null);
    try {
      await resolverNovedad(estado.accessToken, novedadId);
      cargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setResolviendo(null);
    }
  }

  return (
    <div className="lp-novedades-wrapper">
      {/* ===== ÍCONO LATERAL ===== */}
      <div className="lp-novedades-icon-side">
        <img 
          src="/images/Novedades.png" 
          alt="Novedades"
          className="lp-novedades-icon-img"
        />
      </div>

      <div className="lp-novedades-content">
        <div className="lp-novedades-header">
          <div className="lp-novedades-header-left">
            <h1 className="lp-novedades-title">Novedades</h1>
            <p className="lp-novedades-subtitle">Incidentes reportados por los domiciliarios sobre un pedido en curso.</p>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {novedades?.map((novedad) => (
            <div key={novedad.id} className="lp-novedades-card">
              <div className="lp-novedades-card-info">
                <div className="lp-novedades-card-codigo">{novedad.codigoPedido ?? 'Pedido'}</div>
                <div className="lp-novedades-card-detalle">{novedad.detalle}</div>
                <div className="lp-novedades-card-meta">
                  Reportada por {ETIQUETAS_ORIGEN[novedad.origen]} ({novedad.reportadaPorCorreo}) el{' '}
                  {formatearFechaHora(novedad.creadoEn)}
                </div>
              </div>
              <button
                type="button"
                className="lp-novedades-btn lp-novedades-btn-secondary"
                onClick={() => onResolver(novedad.id)}
                disabled={resolviendo === novedad.id}
              >
                {resolviendo === novedad.id ? 'Resolviendo…' : 'Resolver'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}