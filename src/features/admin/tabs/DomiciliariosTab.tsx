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
import './DomiciliariosTab.css';

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
    <div className="lp-domiciliarios-wrapper">
      {/* ===== ÍCONO LATERAL (Grande) ===== */}
      <div className="lp-domiciliarios-icon-side">
        <img 
          src="/images/Domiciliarios.png" 
          alt="Domiciliarios"
          className="lp-domiciliarios-icon-img"
        />
      </div>

      <div className="lp-domiciliarios-content">
        <div className="lp-domiciliarios-header">
          <div className="lp-domiciliarios-header-left">
            <h1 className="lp-domiciliarios-title">Domiciliarios pendientes</h1>
            <p className="lp-domiciliarios-subtitle">Revisá y decidí las solicitudes de validación de Domiciliario.</p>
          </div>
        </div>

        {errorLista ? <Alert tono="error">{errorLista}</Alert> : null}

        {pendientes === null && !errorLista ? <p className="admin-muted">Cargando…</p> : null}

        {pendientes?.length === 0 ? (
          <div className="admin-card admin-empty">No hay domiciliarios pendientes de validación por ahora.</div>
        ) : null}

        {pendientes && pendientes.length > 0 ? (
          <div className="lp-domiciliarios-tabla-container">
            <table className="lp-domiciliarios-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Solicitado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pendientes.map((domiciliario) => (
                  <tr
                    key={domiciliario.usuarioId}
                    onClick={() => setVista({ tipo: 'detalle', id: domiciliario.usuarioId })}
                  >
                    <td style={{ fontWeight: 600 }}>{domiciliario.nombreCompleto ?? 'Sin nombre registrado'}</td>
                    <td>{domiciliario.telefono ?? '—'}</td>
                    <td style={{ color: 'rgba(47, 65, 86, 0.4)' }}>{formatearFecha(domiciliario.solicitadoEn)}</td>
                    <td style={{ color: '#2F4156', fontWeight: 600, textAlign: 'right' }}>Revisar →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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
      <div className="lp-domiciliarios-wrapper">
        <div className="lp-domiciliarios-icon-side">
          <img 
            src="/images/Domiciliarios.png" 
            alt="Domiciliarios"
            className="lp-domiciliarios-icon-img"
          />
        </div>
        <div className="lp-domiciliarios-content">
          <button type="button" className="lp-domiciliarios-btn lp-domiciliarios-btn-secondary" onClick={onVolver} style={{ alignSelf: 'flex-start', marginTop: 24 }}>
            ← Volver
          </button>
          {error ? <Alert tono="error">{error}</Alert> : <p className="admin-muted">Cargando…</p>}
        </div>
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
    <div className="lp-domiciliarios-wrapper">
      <div className="lp-domiciliarios-icon-side">
        <img 
          src="/images/Domiciliarios.png" 
          alt="Domiciliarios"
          className="lp-domiciliarios-icon-img"
        />
      </div>

      <div className="lp-domiciliarios-content">
        <button type="button" className="lp-domiciliarios-btn lp-domiciliarios-btn-secondary" onClick={onVolver} style={{ alignSelf: 'flex-start', marginTop: 24 }}>
          ← Volver a la lista
        </button>

        <div className="lp-domiciliarios-detalle-header">
          <div className="lp-domiciliarios-avatar">
            <div style={{ width: 26, height: 26 }}>
              <MopedIcon />
            </div>
          </div>
          <div>
            <h1 className="lp-domiciliarios-detalle-titulo">{detalle.nombreCompleto ?? 'Domiciliario'}</h1>
            <span className="lp-domiciliarios-detalle-estado">
              {ETIQUETAS_ESTADO[detalle.estado]}
            </span>
          </div>
        </div>

        {error ? <Alert tono="error">{error}</Alert> : null}

        <section className="lp-domiciliarios-card">
          <h2 className="lp-domiciliarios-card-titulo">Datos</h2>
          <p className="lp-domiciliarios-card-texto">Teléfono: {detalle.telefono ?? '—'}</p>
          <p className="lp-domiciliarios-card-texto">Dirección de residencia: {detalle.direccion ?? '—'}</p>
          <p className="lp-domiciliarios-card-texto">
            Vehículo: {detalle.vehiculoTipo ?? '—'} · Placa: {detalle.vehiculoPlaca ?? '—'}
          </p>
          <p className="lp-domiciliarios-card-muted">
            Solicitado el {formatearFechaHora(detalle.solicitadoEn)}
          </p>
        </section>

        <section className="lp-domiciliarios-card">
          <h2 className="lp-domiciliarios-card-titulo">Documentos</h2>
          <div className="lp-domiciliarios-docs-grid">
            {documentos.map((doc) => {
              const contenido = (
                <>
                  <div className="lp-domiciliarios-doc-icon">
                    {doc.url && !esPdf(doc.url) ? (
                      <MiniaturaDocumento url={doc.url} />
                    ) : (
                      <div style={{ width: 22, height: 22 }}>
                        <DocumentIcon />
                      </div>
                    )}
                  </div>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>
                    {doc.label}
                    {doc.url ? '' : ' — no subido'}
                  </span>
                  {doc.url ? (
                    <div style={{ width: 20, height: 20, color: '#567C8D', flexShrink: 0 }}>
                      <ZoomInIcon />
                    </div>
                  ) : null}
                </>
              );

              const estiloFila: CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                textAlign: 'left',
                textDecoration: 'none',
                border: 'none',
                background: 'transparent',
                padding: 0,
                font: 'inherit',
                color: doc.url ? '#2F4156' : 'rgba(47, 65, 86, 0.4)',
                cursor: doc.url ? 'pointer' : 'default',
              };

              if (!doc.url) {
                return (
                  <div key={doc.label} style={estiloFila} className="lp-domiciliarios-doc-item">
                    {contenido}
                  </div>
                );
              }

              if (!esPdf(doc.url)) {
                return (
                  <button key={doc.label} type="button" onClick={() => setImagenAmpliada(doc)} style={estiloFila} className="lp-domiciliarios-doc-item">
                    {contenido}
                  </button>
                );
              }

              return (
                <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer" style={estiloFila} className="lp-domiciliarios-doc-item">
                  {contenido}
                </a>
              );
            })}
          </div>
        </section>

        {esPendiente ? (
          <section className="lp-domiciliarios-card">
            {faltantes.length > 0 ? <Alert tono="info">Falta completar: {faltantes.join(', ')}.</Alert> : null}

            <div className="lp-domiciliarios-acciones">
              <Button onClick={onAprobar} disabled={procesando || faltantes.length > 0}>
                {procesando ? 'Procesando…' : 'Aprobar'}
              </Button>

              {!mostrarMotivo ? (
                <Button variante="secondary" onClick={() => setMostrarMotivo(true)} disabled={procesando}>
                  Rechazar
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', width: '100%' }}>
                  <label htmlFor="motivo-rechazo" style={{ fontSize: '0.875rem', color: '#2F4156' }}>
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
                      padding: '10px',
                      borderRadius: '8px',
                      border: `${errorMotivo ? 2 : 1}px solid #2F4156`,
                      background: 'rgba(47, 65, 86, 0.01)',
                      color: '#2F4156',
                      resize: 'vertical',
                      width: '100%',
                    }}
                  />
                  {errorMotivo ? (
                    <span style={{ fontSize: '0.8rem', color: '#2F4156', fontWeight: 600 }}>
                      ⚠ {errorMotivo}
                    </span>
                  ) : null}
                  <div className="lp-domiciliarios-acciones">
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
                </div>
              )}
            </div>
          </section>
        ) : null}

        {detalle.historial.length > 0 ? (
          <section className="lp-domiciliarios-card">
            <h2 className="lp-domiciliarios-card-titulo">Historial</h2>
            {detalle.historial.map((item, indice) => (
              <div key={indice} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, color: '#2F4156', flexShrink: 0 }}>
                  {item.decision === 'aprobado' ? <CheckCircleIcon /> : <XCircleIcon />}
                </div>
                <div>
                  <strong>{item.decision === 'aprobado' ? 'Aprobado' : 'Rechazado'}</strong> por{' '}
                  {item.adminCorreo} el {formatearFechaHora(item.creadoEn)}
                  {item.motivo ? <div style={{ color: 'rgba(47, 65, 86, 0.6)' }}>Motivo: {item.motivo}</div> : null}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {imagenAmpliada?.url ? (
          <ImageLightbox url={imagenAmpliada.url} label={imagenAmpliada.label} onClose={() => setImagenAmpliada(null)} />
        ) : null}
      </div>
    </div>
  );
}