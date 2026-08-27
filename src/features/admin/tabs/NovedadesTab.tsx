import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { listarNovedadesAbiertas, resolverNovedad, type NovedadAbierta } from '../api/pedidosAdminApi';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="admin-page-header">
        <h1>Novedades</h1>
        <p>Incidentes reportados por los domiciliarios sobre un pedido en curso.</p>
      </div>

      {error ? <Alert tono="error">{error}</Alert> : null}

      {novedades === null && !error ? <p className="admin-muted">Cargando…</p> : null}

      {novedades?.length === 0 ? (
        <div className="admin-card admin-empty">No hay novedades pendientes de atender.</div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {novedades?.map((novedad) => (
          <div key={novedad.id} className="admin-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{novedad.codigoPedido ?? 'Pedido'}</div>
              <div>{novedad.detalle}</div>
              <div className="admin-muted">
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
      </div>
    </div>
  );
}
