import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { ImageLightbox } from '../../../shared/components/ImageLightbox';
import { CheckCircleIcon, DocumentIcon, MopedIcon, XCircleIcon, ZoomInIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  aprobarDomiciliario,
  listarDomiciliariosPendientes,
  obtenerDetalleDomiciliario,
  rechazarDomiciliario,
  type DetalleDomiciliario,
  type DomiciliarioPendiente,
} from '../../domiciliarios/api/domiciliariosApi';

type Documento = { label: string; url: string | null };

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

const ETIQUETAS_ESTADO: Record<DetalleDomiciliario['estado'], string> = {
  pendiente_validacion: 'Pendiente de validación',
  habilitado: 'Habilitado',
  rechazado: 'Rechazado',
};

function tarjeta(): CSSProperties {
  return {
    background: 'var(--color-white)',
    borderRadius: 16,
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  };
}

/** G05 — mismos 7 requisitos que valida `app.aprobar_domiciliario`. */
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

/**
 * "Domiciliarios" — validaciones pendientes (G01/HU-08). Lista +
 * detalle en un solo componente con estado local (`vista`) en vez de
 * rutas separadas — ya no es una página aparte, es una sección de
 * `AdminShell`; volver de un detalle a la lista no debe re-pedirla si
 * ya se había cargado antes.
 */
export function DomiciliariosTab() {
  const { estado } = useAuth();
  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'detalle'; id: string }>({
    tipo: 'lista',
  });
  const [pendientes, setPendientes] = useState<DomiciliarioPendiente[] | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  const cargarLista = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorLista(null);
    listarDomiciliariosPendientes(estado.accessToken)
      .then(setPendientes)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorLista(err.message);
        } else {
          throw err;
        }
      });
  }, [estado]);

  useEffect(() => {
    if (pendientes === null) cargarLista();
    // Solo la primera vez que se monta esta sección — recargar tras
    // aprobar/rechazar lo dispara `onDecidido` explícitamente, no este
    // efecto (evita re-pedir la lista en cada re-render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;

  if (vista.tipo === 'detalle') {
    return (
      <DomiciliarioDetalle
        domiciliarioId={vista.id}
        onVolver={() => setVista({ tipo: 'lista' })}
        onDecidido={cargarLista}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1>Domiciliarios pendientes</h1>

      {errorLista ? <Alert tono="error">{errorLista}</Alert> : null}

      {pendientes === null && !errorLista ? (
        <p style={{ color: 'var(--color-teal)' }}>Cargando…</p>
      ) : null}

      {pendientes?.length === 0 ? (
        <div style={{ ...tarjeta(), textAlign: 'center', color: 'var(--color-teal)' }}>
          No hay domiciliarios pendientes de validación por ahora.
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {pendientes?.map((domiciliario) => (
          <button
            key={domiciliario.usuarioId}
            onClick={() => setVista({ tipo: 'detalle', id: domiciliario.usuarioId })}
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
    </div>
  );
}

function DomiciliarioDetalle({
  domiciliarioId,
  onVolver,
  onDecidido,
}: {
  domiciliarioId: string;
  onVolver: () => void;
  onDecidido: () => void;
}) {
  const { estado } = useAuth();
  const [detalle, setDetalle] = useState<DetalleDomiciliario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<Documento | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    obtenerDetalleDomiciliario(estado.accessToken, domiciliarioId)
      .then(setDetalle)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado, domiciliarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  async function onAprobar() {
    setProcesando(true);
    setError(null);
    try {
      await aprobarDomiciliario(accessToken, domiciliarioId);
      cargar();
      onDecidido();
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
      await rechazarDomiciliario(accessToken, domiciliarioId, motivo.trim());
      setMostrarMotivo(false);
      setMotivo('');
      cargar();
      onDecidido();
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Button variante="secondary" onClick={onVolver} style={{ width: 'auto', alignSelf: 'flex-start' }}>
          ← Volver
        </Button>
        {error ? <Alert tono="error">{error}</Alert> : <p style={{ color: 'var(--color-teal)' }}>Cargando…</p>}
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Button variante="secondary" onClick={onVolver} style={{ width: 'auto', alignSelf: 'flex-start' }}>
        ← Volver a la lista
      </Button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-sky-blue)',
            color: 'var(--color-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 26, height: 26 }}>
            <MopedIcon />
          </div>
        </div>
        <div>
          <h1 style={{ marginBottom: 2 }}>{detalle.nombreCompleto ?? 'Domiciliario'}</h1>
          <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>
            {ETIQUETAS_ESTADO[detalle.estado]}
          </span>
        </div>
      </div>

      {error ? <Alert tono="error">{error}</Alert> : null}

      <section style={tarjeta()}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Datos</h2>
        <p>Teléfono: {detalle.telefono ?? '—'}</p>
        <p>Dirección de residencia: {detalle.direccion ?? '—'}</p>
        <p>
          Vehículo: {detalle.vehiculoTipo ?? '—'} · Placa: {detalle.vehiculoPlaca ?? '—'}
        </p>
        <p style={{ color: 'var(--color-teal)', fontSize: '0.875rem' }}>
          Solicitado el {formatearFechaHora(detalle.solicitadoEn)}
        </p>
      </section>

      <section style={tarjeta()}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Documentos</h2>
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

          if (!esPdf(doc.url)) {
            return (
              <button key={doc.label} type="button" onClick={() => setImagenAmpliada(doc)} style={estiloFila}>
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
        <section style={tarjeta()}>
          {faltantes.length > 0 ? <Alert tono="info">Falta completar: {faltantes.join(', ')}.</Alert> : null}

          <Button onClick={onAprobar} disabled={procesando || faltantes.length > 0}>
            {procesando ? 'Procesando…' : 'Aprobar'}
          </Button>

          {!mostrarMotivo ? (
            <Button variante="secondary" onClick={() => setMostrarMotivo(true)} disabled={procesando}>
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
        <section style={tarjeta()}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Historial</h2>
          {detalle.historial.map((item, indice) => (
            <div key={indice} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, color: 'var(--color-navy)', flexShrink: 0 }}>
                {item.decision === 'aprobado' ? <CheckCircleIcon /> : <XCircleIcon />}
              </div>
              <div>
                <strong>{item.decision === 'aprobado' ? 'Aprobado' : 'Rechazado'}</strong> por{' '}
                {item.adminCorreo} el {formatearFechaHora(item.creadoEn)}
                {item.motivo ? <div style={{ color: 'var(--color-teal)' }}>Motivo: {item.motivo}</div> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {imagenAmpliada?.url ? (
        <ImageLightbox url={imagenAmpliada.url} label={imagenAmpliada.label} onClose={() => setImagenAmpliada(null)} />
      ) : null}
    </div>
  );
}
