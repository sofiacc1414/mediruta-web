import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import { MopedIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { listarDomiciliariosPendientes, type DomiciliarioPendiente } from '../api/domiciliariosApi';

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** G01 — HU-08. Lista de domiciliarios con validación pendiente. */
export function DomiciliariosPendientesPage() {
  const { estado } = useAuth();
  const navigate = useNavigate();
  const [pendientes, setPendientes] = useState<DomiciliarioPendiente[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estado.tipo !== 'autenticado') return;
    listarDomiciliariosPendientes(estado.accessToken)
      .then(setPendientes)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado]);

  if (estado.tipo !== 'autenticado') return null;

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <IconBadge icon={<MopedIcon />} />
          <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Domiciliarios pendientes</h1>
        </div>

        {error ? <Alert tono="error">{error}</Alert> : null}

        {pendientes === null && !error ? (
          <p style={{ textAlign: 'center', color: 'var(--color-teal)' }}>Cargando…</p>
        ) : null}

        {pendientes?.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-6)',
              background: 'var(--color-white)',
              borderRadius: 16,
              color: 'var(--color-teal)',
            }}
          >
            No hay domiciliarios pendientes de validación por ahora.
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {pendientes?.map((domiciliario) => (
            <button
              key={domiciliario.usuarioId}
              onClick={() => navigate(`/domiciliarios/${domiciliario.usuarioId}`)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-4)',
                width: '100%',
                textAlign: 'left',
                padding: 'var(--space-4) var(--space-5)',
                borderRadius: 16,
                border: '1.5px solid var(--color-sky-blue)',
                background: 'var(--color-white)',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-navy)' }}>
                  {domiciliario.nombreCompleto ?? 'Sin nombre registrado'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-teal)' }}>
                  {domiciliario.telefono ?? 'Sin teléfono'} · Solicitado el{' '}
                  {formatearFecha(domiciliario.solicitadoEn)}
                </div>
              </div>
              <span style={{ color: 'var(--color-navy)', fontWeight: 600 }}>Revisar →</span>
            </button>
          ))}
        </div>

        <Button variante="secondary" onClick={() => navigate('/')}>
          Volver al panel
        </Button>
      </div>
    </main>
  );
}
