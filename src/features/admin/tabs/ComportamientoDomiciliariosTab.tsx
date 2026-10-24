import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { ShieldIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { bloquearCuenta, desbloquearCuenta } from '../api/cuentasAdminApi';
import {
  listarComportamientoDomiciliarios,
  obtenerDetalleComportamientoDomiciliario,
  type DetalleComportamientoDomiciliario,
  type EventoComportamiento,
  type ResumenComportamientoDomiciliario,
} from '../api/comportamientoDomiciliariosApi';
import './ComportamientoDomiciliariosTab.css';

const ETIQUETAS_ESTADO_CUENTA: Record<string, string> = {
  activa: 'Activa',
  bloqueada: 'Bloqueada',
  desactivada: 'Desactivada',
};

function primerDiaDelMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sinActividad(resumen: ResumenComportamientoDomiciliario): boolean {
  return (
    resumen.entregasRealizadas === 0 &&
    resumen.cancelaciones === 0 &&
    resumen.incidentesReportados === 0 &&
    resumen.calificacionesCantidad === 0
  );
}

/** G01-G05 — supervisión del comportamiento operativo de los
 * domiciliarios: entregas, cancelaciones, incidentes y calificaciones,
 * por periodo, para detectar patrones inusuales. El bloqueo/
 * reactivación de la cuenta (G04) reutiliza el mismo endpoint que
 * `UsuariosTab` — es el mismo proceso de gestión de usuarios y
 * permisos, con su misma trazabilidad, solo que iniciado desde acá. */
export function ComportamientoDomiciliariosTab() {
  const { estado } = useAuth();

  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoyIso());
  const [resumenes, setResumenes] = useState<ResumenComportamientoDomiciliario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'detalle'; id: string }>({
    tipo: 'lista',
  });

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    listarComportamientoDomiciliarios(estado.accessToken, desde, hasta)
      .then(setResumenes)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  if (vista.tipo === 'detalle') {
    return (
      <DetalleDomiciliario
        accessToken={accessToken}
        domiciliarioId={vista.id}
        desde={desde}
        hasta={hasta}
        onVolver={() => setVista({ tipo: 'lista' })}
        onCambioEstado={cargar}
      />
    );
  }

  return (
    <div className="lp-comportamiento-page">
      <div className="lp-comportamiento-card">
        <h2 className="lp-comportamiento-card-titulo">
          <ShieldIcon /> Comportamiento de domiciliarios
        </h2>
        <p className="lp-comportamiento-card-ayuda">
          Entregas, cancelaciones, incidentes y calificaciones por domiciliario, para detectar patrones
          inusuales. "Rechazos" no está disponible: el sistema no registra ese evento (la asignación es por
          aceptar primero, sin oferta explícita que se pueda rechazar).
        </p>

        <div className="lp-comportamiento-rango-fechas">
          <label>
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>

        {error ? <Alert tono="error">{error}</Alert> : null}

        {resumenes === null && !error ? <p className="lp-comportamiento-cargando">Cargando…</p> : null}

        {resumenes?.length === 0 ? (
          <div className="admin-card admin-empty">No hay domiciliarios habilitados todavía.</div>
        ) : null}

        {resumenes && resumenes.length > 0 ? (
          <table className="lp-comportamiento-tabla">
            <thead>
              <tr>
                <th>Domiciliario</th>
                <th>Estado</th>
                <th>Entregas</th>
                <th>Cancelaciones</th>
                <th>Incidentes</th>
                <th>Rechazos</th>
                <th>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {resumenes.map((r) => (
                <tr key={r.domiciliarioId} onClick={() => setVista({ tipo: 'detalle', id: r.domiciliarioId })}>
                  <td style={{ fontWeight: 600 }}>
                    {r.nombreCompleto}
                    <div className="lp-comportamiento-correo">{r.correo}</div>
                  </td>
                  <td>{ETIQUETAS_ESTADO_CUENTA[r.estadoCuenta] ?? r.estadoCuenta}</td>
                  <td>{r.entregasRealizadas}</td>
                  <td>{r.cancelaciones}</td>
                  <td>
                    {r.incidentesReportados}
                    {r.incidentesAbiertos > 0 ? (
                      <span className="lp-comportamiento-badge lp-comportamiento-badge-alerta">
                        {r.incidentesAbiertos} abierto(s)
                      </span>
                    ) : null}
                  </td>
                  <td className="lp-comportamiento-no-disponible">No disponible</td>
                  <td>
                    {r.calificacionPromedio !== null
                      ? `${r.calificacionPromedio.toFixed(1)} ★ (${r.calificacionesCantidad})`
                      : sinActividad(r)
                        ? 'Sin datos'
                        : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

function EtiquetaEvento({ evento }: { evento: EventoComportamiento }) {
  switch (evento.tipo) {
    case 'entrega':
      return (
        <span>
          Pedido <strong>{evento.codigoPedido ?? '—'}</strong> entregado.
        </span>
      );
    case 'cancelacion':
      return (
        <span>
          Pedido <strong>{evento.codigoPedido ?? '—'}</strong> cancelado.
        </span>
      );
    case 'incidente':
      return (
        <span>
          Incidente en pedido <strong>{evento.codigoPedido ?? '—'}</strong>: {evento.detalle}{' '}
          <span
            className={
              evento.resuelto
                ? 'lp-comportamiento-badge lp-comportamiento-badge-ok'
                : 'lp-comportamiento-badge lp-comportamiento-badge-alerta'
            }
          >
            {evento.resuelto ? 'Resuelto' : 'Abierto'}
          </span>
        </span>
      );
    case 'calificacion':
      return (
        <span>
          Calificación del pedido <strong>{evento.codigoPedido ?? '—'}</strong>: {evento.puntuacion} ★
          {evento.comentario ? ` — "${evento.comentario}"` : ''}
        </span>
      );
  }
}

function DetalleDomiciliario({
  accessToken,
  domiciliarioId,
  desde,
  hasta,
  onVolver,
  onCambioEstado,
}: {
  accessToken: string;
  domiciliarioId: string;
  desde: string;
  hasta: string;
  onVolver: () => void;
  onCambioEstado: () => void;
}) {
  const [detalle, setDetalle] = useState<DetalleComportamientoDomiciliario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setError(null);
    obtenerDetalleComportamientoDomiciliario(accessToken, domiciliarioId, desde, hasta)
      .then(setDetalle)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [accessToken, domiciliarioId, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function onBloquear(evento: FormEvent) {
    evento.preventDefault();
    setProcesando(true);
    setError(null);
    try {
      const resultado = await bloquearCuenta(accessToken, domiciliarioId, motivoBloqueo);
      setMensaje(resultado.message);
      setMostrarMotivo(false);
      setMotivoBloqueo('');
      cargar();
      onCambioEstado();
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

  async function onDesbloquear() {
    setProcesando(true);
    setError(null);
    try {
      const resultado = await desbloquearCuenta(accessToken, domiciliarioId);
      setMensaje(resultado.message);
      cargar();
      onCambioEstado();
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

  return (
    <div className="lp-comportamiento-page">
      <button type="button" className="lp-comportamiento-btn lp-comportamiento-btn-secundario" onClick={onVolver}>
        ← Volver al listado
      </button>

      {error ? <Alert tono="error">{error}</Alert> : null}
      {mensaje ? <Alert tono="exito">{mensaje}</Alert> : null}
      {!detalle && !error ? <p className="lp-comportamiento-cargando">Cargando…</p> : null}

      {detalle ? (
        <>
          <div className="lp-comportamiento-card">
            <h2 className="lp-comportamiento-card-titulo">{detalle.resumen.nombreCompleto}</h2>
            <p className="lp-comportamiento-card-ayuda">
              {detalle.resumen.correo} ·{' '}
              {ETIQUETAS_ESTADO_CUENTA[detalle.resumen.estadoCuenta] ?? detalle.resumen.estadoCuenta}
            </p>

            {/* G04 — misma acción/endpoint de bloqueo que usa UsuariosTab:
                este botón "dirige la acción al proceso de gestión de
                usuarios y permisos", con su misma trazabilidad (motivo
                guardado del lado del backend). */}
            {detalle.resumen.estadoCuenta === 'bloqueada' || detalle.resumen.estadoCuenta === 'desactivada' ? (
              <Button
                variante="secondary"
                style={{ width: 'auto', alignSelf: 'flex-start' }}
                disabled={procesando}
                onClick={onDesbloquear}
              >
                {procesando ? 'Reactivando…' : 'Reactivar cuenta'}
              </Button>
            ) : (
              <Button
                variante="secondary"
                style={{ width: 'auto', alignSelf: 'flex-start' }}
                disabled={procesando}
                onClick={() => setMostrarMotivo((v) => !v)}
              >
                Bloquear cuenta
              </Button>
            )}

            {mostrarMotivo ? (
              <form onSubmit={onBloquear} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Input
                  label="Motivo del bloqueo"
                  required
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  disabled={procesando}
                />
                <Button type="submit" variante="secondary" disabled={procesando} style={{ width: 'auto', alignSelf: 'flex-start' }}>
                  {procesando ? 'Bloqueando…' : 'Confirmar bloqueo'}
                </Button>
              </form>
            ) : null}
          </div>

          <div className="lp-comportamiento-card">
            <h2 className="lp-comportamiento-card-titulo">Resumen del periodo</h2>
            <div className="lp-comportamiento-resumen-grid">
              <div className="lp-comportamiento-resumen-celda">
                <span className="lp-comportamiento-resumen-etiqueta">Entregas</span>
                <span className="lp-comportamiento-resumen-valor">{detalle.resumen.entregasRealizadas}</span>
              </div>
              <div className="lp-comportamiento-resumen-celda">
                <span className="lp-comportamiento-resumen-etiqueta">Cancelaciones</span>
                <span className="lp-comportamiento-resumen-valor">{detalle.resumen.cancelaciones}</span>
              </div>
              <div className="lp-comportamiento-resumen-celda">
                <span className="lp-comportamiento-resumen-etiqueta">Incidentes</span>
                <span className="lp-comportamiento-resumen-valor">
                  {detalle.resumen.incidentesReportados} ({detalle.resumen.incidentesAbiertos} abierto(s))
                </span>
              </div>
              <div className="lp-comportamiento-resumen-celda">
                <span className="lp-comportamiento-resumen-etiqueta">Rechazos</span>
                <span className="lp-comportamiento-resumen-valor lp-comportamiento-no-disponible">
                  No disponible
                </span>
              </div>
              <div className="lp-comportamiento-resumen-celda">
                <span className="lp-comportamiento-resumen-etiqueta">Calificación promedio</span>
                <span className="lp-comportamiento-resumen-valor">
                  {detalle.resumen.calificacionPromedio !== null
                    ? `${detalle.resumen.calificacionPromedio.toFixed(1)} ★ (${detalle.resumen.calificacionesCantidad})`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="lp-comportamiento-card">
            <h2 className="lp-comportamiento-card-titulo">Actividad en el periodo</h2>
            {sinActividad(detalle.resumen) ? (
              <div className="admin-card admin-empty">
                No hay datos suficientes para mostrar: este domiciliario no tiene actividad registrada en el
                periodo seleccionado.
              </div>
            ) : (
              <ul className="lp-comportamiento-timeline">
                {detalle.eventos.map((evento, i) => (
                  <li key={i} className="lp-comportamiento-timeline-item">
                    <span className="lp-comportamiento-timeline-fecha">{formatearFecha(evento.fecha)}</span>
                    <EtiquetaEvento evento={evento} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
