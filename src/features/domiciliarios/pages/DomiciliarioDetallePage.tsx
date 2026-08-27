import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import { ImageLightbox } from '../../../shared/components/ImageLightbox';
import {
  CheckCircleIcon,
  DocumentIcon,
  MopedIcon,
  XCircleIcon,
  ZoomInIcon,
} from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  aprobarDomiciliario,
  obtenerDetalleDomiciliario,
  rechazarDomiciliario,
  type DetalleDomiciliario,
} from '../api/domiciliariosApi';

type Documento = { label: string; url: string | null };

/** Miniatura de 44px de un documento — si la imagen no carga (URL
 * firmada vencida, archivo corrupto, sin conexión) cae al ícono de
 * documento en vez del cuadrito roto que arma el navegador por
 * defecto. */
function MiniaturaDocumento({ url }: { url: string }) {
  const [fallo, setFallo] = useState(false);

  if (fallo) {
    return (
      <div style={{ width: 22, height: 22, color: 'var(--color-teal)' }}>
        <DocumentIcon />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      onError={() => setFallo(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

/** G05 — mismos 7 requisitos que valida `app.aprobar_domiciliario` en la
 * API, calculados acá para deshabilitar "Aprobar" preventivamente en vez
 * de dejar que el usuario choque con el 422 del backend. */
function calcularFaltantes(detalle: DetalleDomiciliario): string[] {
  const requisitos: [string, unknown][] = [
    ['Dirección de residencia', detalle.direccion],
    ['Tipo de vehículo', detalle.vehiculoTipo],
    ['Placa', detalle.vehiculoPlaca],
    ['Cédula (frente)', detalle.cedulaFrenteUrl],
    ['Cédula (reverso)', detalle.cedulaReversoUrl],
    ['Licencia de conducción', detalle.licenciaUrl],
    ['SOAT', detalle.soatUrl],
    ['Tecnomecánica', detalle.tecnicomecanicaUrl],
  ];
  return requisitos
    .filter(([, valor]) => valor === null || (typeof valor === 'string' && valor.trim() === ''))
    .map(([label]) => label);
}

function esPdf(url: string) {
  return url.split('?')[0].toLowerCase().endsWith('.pdf');
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ETIQUETAS_ESTADO: Record<DetalleDomiciliario['estado'], string> = {
  pendiente_validacion: 'Pendiente de validación',
  habilitado: 'Habilitado',
  rechazado: 'Rechazado',
};

export function DomiciliarioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { estado } = useAuth();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState<DetalleDomiciliario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<Documento | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado' || !id) return;
    setError(null);
    obtenerDetalleDomiciliario(estado.accessToken, id)
      .then(setDetalle)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado, id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado.tipo !== 'autenticado' || !id) return null;
  const accessToken = estado.accessToken;

  async function onAprobar() {
    setProcesando(true);
    setError(null);
    try {
      await aprobarDomiciliario(accessToken, id);
      cargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setProcesando(false);
    }
  }

  async function onConfirmarRechazo() {
    if (motivo.trim().length < 5) {
      setErrorMotivo('Contá al menos 5 caracteres del motivo del rechazo.');
      return;
    }
    setErrorMotivo(null);
    setProcesando(true);
    setError(null);
    try {
      await rechazarDomiciliario(accessToken, id, motivo.trim());
      setMostrarMotivo(false);
      setMotivo('');
      cargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setProcesando(false);
    }
  }

  if (!detalle) {
    return (
      <main style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error ? <Alert tono="error">{error}</Alert> : <p style={{ color: 'var(--color-teal)' }}>Cargando…</p>}
      </main>
    );
  }

  const faltantes = calcularFaltantes(detalle);
  const esPendiente = detalle.estado === 'pendiente_validacion';
  const documentos: Documento[] = [
    { label: 'Cédula (frente)', url: detalle.cedulaFrenteUrl },
    { label: 'Cédula (reverso)', url: detalle.cedulaReversoUrl },
    { label: 'Licencia de conducción', url: detalle.licenciaUrl },
    { label: 'SOAT', url: detalle.soatUrl },
    { label: 'Tecnomecánica', url: detalle.tecnicomecanicaUrl },
  ];

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
          <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>
            {detalle.nombreCompleto ?? 'Domiciliario'}
          </h1>
          <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>
            {ETIQUETAS_ESTADO[detalle.estado]}
          </span>
        </div>

        {error ? <Alert tono="error">{error}</Alert> : null}

        <section
          style={{
            background: 'var(--color-white)',
            borderRadius: 16,
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <h2 style={{ fontSize: '1rem', color: 'var(--color-navy)' }}>Datos</h2>
          <p style={{ color: 'var(--color-navy)' }}>Teléfono: {detalle.telefono ?? '—'}</p>
          <p style={{ color: 'var(--color-navy)' }}>Dirección de residencia: {detalle.direccion ?? '—'}</p>
          <p style={{ color: 'var(--color-navy)' }}>
            Vehículo: {detalle.vehiculoTipo ?? '—'} · Placa: {detalle.vehiculoPlaca ?? '—'}
          </p>
          <p style={{ color: 'var(--color-teal)', fontSize: '0.875rem' }}>
            Solicitado el {formatearFecha(detalle.solicitadoEn)}
          </p>
        </section>

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
          <h2 style={{ fontSize: '1rem', color: 'var(--color-navy)' }}>Documentos</h2>
          {documentos.map((doc) => {
            const contenido = (
              <>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: 'var(--color-beige)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {doc.url && !esPdf(doc.url) ? (
                    <MiniaturaDocumento url={doc.url} />
                  ) : (
                    <div style={{ width: 22, height: 22 }}>
                      <DocumentIcon />
                    </div>
                  )}
                </div>
                <span style={{ flex: 1 }}>
                  {doc.label}
                  {doc.url ? '' : ' — no subido'}
                </span>
                {doc.url ? (
                  <div style={{ width: 20, height: 20, color: 'var(--color-teal)', flexShrink: 0 }}>
                    <ZoomInIcon />
                  </div>
                ) : null}
              </>
            );

            const estiloFila: CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              width: '100%',
              textAlign: 'left',
              textDecoration: 'none',
              border: 'none',
              background: 'transparent',
              padding: 0,
              font: 'inherit',
              color: doc.url ? 'var(--color-navy)' : 'var(--color-teal)',
              cursor: doc.url ? 'pointer' : 'default',
            };

            if (!doc.url) {
              return (
                <div key={doc.label} style={estiloFila}>
                  {contenido}
                </div>
              );
            }

            // Imágenes se ven en el visor propio, a lo grande, en vez de
            // navegar a una pestaña nueva con la URL firmada pelada — es
            // el "formato más amplio" que pidió el administrador. Un PDF
            // ya lo abre bien el visor nativo del navegador.
            if (!esPdf(doc.url)) {
              return (
                <button
                  key={doc.label}
                  type="button"
                  onClick={() => setImagenAmpliada(doc)}
                  style={estiloFila}
                >
                  {contenido}
                </button>
              );
            }

            return (
              <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer" style={estiloFila}>
                {contenido}
              </a>
            );
          })}
        </section>

        {esPendiente ? (
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
            {faltantes.length > 0 ? (
              <Alert tono="info">
                Falta completar: {faltantes.join(', ')}.
              </Alert>
            ) : null}

            <Button onClick={onAprobar} disabled={procesando || faltantes.length > 0}>
              {procesando ? 'Procesando…' : 'Aprobar'}
            </Button>

            {!mostrarMotivo ? (
              <Button
                variante="secondary"
                onClick={() => setMostrarMotivo(true)}
                disabled={procesando}
              >
                Rechazar
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', textAlign: 'left' }}>
                <label htmlFor="motivo-rechazo" style={{ fontSize: '0.875rem', color: 'var(--color-navy)' }}>
                  Motivo del rechazo
                </label>
                <textarea
                  id="motivo-rechazo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={procesando}
                  rows={3}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    padding: 'var(--space-3)',
                    borderRadius: 16,
                    border: `${errorMotivo ? 2 : 1}px solid var(--color-navy)`,
                    background: 'var(--color-beige)',
                    color: 'var(--color-navy)',
                    resize: 'vertical',
                  }}
                />
                {errorMotivo ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-navy)', fontWeight: 600 }}>
                    ⚠ {errorMotivo}
                  </span>
                ) : null}
                <Button onClick={onConfirmarRechazo} disabled={procesando}>
                  {procesando ? 'Procesando…' : 'Confirmar rechazo'}
                </Button>
                <Button
                  variante="secondary"
                  onClick={() => {
                    setMostrarMotivo(false);
                    setMotivo('');
                    setErrorMotivo(null);
                  }}
                  disabled={procesando}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </section>
        ) : null}

        {detalle.historial.length > 0 ? (
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
            <h2 style={{ fontSize: '1rem', color: 'var(--color-navy)' }}>Historial</h2>
            {detalle.historial.map((item, indice) => (
              <div key={indice} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, color: 'var(--color-navy)', flexShrink: 0 }}>
                  {item.decision === 'aprobado' ? <CheckCircleIcon /> : <XCircleIcon />}
                </div>
                <div style={{ color: 'var(--color-navy)' }}>
                  <strong>{item.decision === 'aprobado' ? 'Aprobado' : 'Rechazado'}</strong> por{' '}
                  {item.adminCorreo} el {formatearFecha(item.creadoEn)}
                  {item.motivo ? <div style={{ color: 'var(--color-teal)' }}>Motivo: {item.motivo}</div> : null}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <Button variante="secondary" onClick={() => navigate('/domiciliarios')}>
          Volver a la lista
        </Button>
      </div>

      {imagenAmpliada?.url ? (
        <ImageLightbox
          url={imagenAmpliada.url}
          label={imagenAmpliada.label}
          onClose={() => setImagenAmpliada(null)}
        />
      ) : null}
    </main>
  );
}
