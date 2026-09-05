import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  aprobarEdicionNovedad,
  listarNovedadesAbiertas,
  reenviarCodigoEntregaCorreo,
  regenerarCodigoEntrega,
  rechazarEdicionNovedad,
  resolverNovedad,
  type NovedadAbierta,
  type TipoNovedad,
} from '../api/pedidosAdminApi';
import { AccionesCodigoEntrega } from './AccionesCodigoEntrega';
import { DiffEdicionPedido } from './DiffEdicionPedido';
import './NovedadesTab.css';

const ETIQUETAS_ORIGEN: Record<NovedadAbierta['origen'], string> = {
  paciente: 'el paciente',
  domiciliario: 'el domiciliario',
};

const ETIQUETAS_TIPO: Record<TipoNovedad, string> = {
  pregunta: 'Pregunta',
  edicion: 'Edición',
  codigo: 'Código',
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

/** "Novedades" — lo que el Paciente/Domiciliario reporta sobre un
 * pedido en curso, todavía sin atender (HU-07). Pestaña propia,
 * separada de Pedidos — es lo primero que un admin necesita atender
 * al entrar al panel.
 *
 * Desde la ronda 3, cada novedad trae un `tipo` que cambia qué acciones
 * ofrece esta pantalla:
 * - 'pregunta' → mensaje directo de siempre: un botón "Resolver".
 * - 'edicion'  → el paciente pidió corregir un dato del pedido: se ve
 *   el diff antes/propuesto (`DiffEdicionPedido`) y se aprueba o
 *   rechaza.
 * - 'codigo'   → el paciente no vio su código de entrega:
 *   `AccionesCodigoEntrega` deja regenerarlo o reenviarlo por correo.
 */
export function NovedadesTab() {
  const { estado } = useAuth();
  const [novedades, setNovedades] = useState<NovedadAbierta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

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

  async function ejecutar(
    novedadId: string,
    accion: () => Promise<{ message: string }>,
    { recargar = true }: { recargar?: boolean } = {},
  ) {
    if (estado.tipo !== 'autenticado') return;
    setProcesando(novedadId);
    setError(null);
    setExito(null);
    try {
      const resultado = await accion();
      setExito(resultado.message);
      if (recargar) cargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setProcesando(null);
    }
  }

  const accessToken = estado.accessToken;

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
        {exito ? <Alert tono="exito">{exito}</Alert> : null}

        {novedades === null && !error ? <p className="admin-muted">Cargando…</p> : null}

        {novedades?.length === 0 ? (
          <div className="lp-novedades-vacio">
            <h3>¡Todo en orden!</h3>
            <p>No hay novedades pendientes de atender.</p>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {novedades?.map((novedad) => {
            const enProceso = procesando === novedad.id;
            return (
              <div
                key={novedad.id}
                className="lp-novedades-card"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div className="lp-novedades-card-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="lp-novedades-card-codigo">{novedad.codigoPedido ?? 'Pedido'}</span>
                      <span className={`admin-tag admin-tag--${novedad.tipo}`}>
                        {ETIQUETAS_TIPO[novedad.tipo]}
                      </span>
                    </div>
                    <div className="lp-novedades-card-detalle">{novedad.detalle}</div>
                    <div className="lp-novedades-card-meta">
                      Reportada por {ETIQUETAS_ORIGEN[novedad.origen]} ({novedad.reportadaPorCorreo}) el{' '}
                      {formatearFechaHora(novedad.creadoEn)}
                    </div>
                  </div>

                  {novedad.tipo === 'pregunta' || novedad.tipo === 'codigo' ? (
                    <button
                      type="button"
                      className="lp-novedades-btn lp-novedades-btn-secondary"
                      onClick={() =>
                        ejecutar(novedad.id, () => resolverNovedad(accessToken, novedad.id))
                      }
                      disabled={enProceso}
                    >
                      {enProceso ? 'Resolviendo…' : 'Resolver'}
                    </button>
                  ) : null}
                </div>

                {novedad.tipo === 'edicion' ? (
                  <>
                    <DiffEdicionPedido
                      actuales={novedad.datosActuales}
                      propuestos={novedad.datosPropuestos}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="lp-novedades-btn lp-novedades-btn-primary"
                        onClick={() =>
                          ejecutar(novedad.id, () => aprobarEdicionNovedad(accessToken, novedad.id))
                        }
                        disabled={enProceso}
                      >
                        {enProceso ? 'Aplicando…' : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        className="lp-novedades-btn lp-novedades-btn-secondary"
                        onClick={() =>
                          ejecutar(novedad.id, () => rechazarEdicionNovedad(accessToken, novedad.id))
                        }
                        disabled={enProceso}
                      >
                        {enProceso ? 'Rechazando…' : 'Rechazar'}
                      </button>
                    </div>
                  </>
                ) : null}

                {novedad.tipo === 'codigo' ? (
                  <AccionesCodigoEntrega
                    codigoEntrega={novedad.codigoEntrega}
                    regenerando={enProceso}
                    reenviando={enProceso}
                    onRegenerar={() =>
                      ejecutar(
                        novedad.id,
                        () => regenerarCodigoEntrega(accessToken, novedad.solicitudId),
                        { recargar: false },
                      )
                    }
                    onReenviar={() =>
                      ejecutar(
                        novedad.id,
                        () => reenviarCodigoEntregaCorreo(accessToken, novedad.solicitudId),
                        { recargar: false },
                      )
                    }
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
