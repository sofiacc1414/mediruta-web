import { useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ImageLightbox } from '../../../shared/components/ImageLightbox';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { DomiciliarioCard, MedicamentosRecetaCard, PacienteCard } from '../components/PedidoResumenCards';
import {
  aprobarEdicionNovedad,
  obtenerDetallePedidoAdmin,
  reenviarCodigoEntregaCorreo,
  regenerarCodigoEntrega,
  rechazarEdicionNovedad,
  resolverNovedad,
  type DetallePedidoAdmin,
  type NovedadAbierta,
  type TipoNovedad,
} from '../api/pedidosAdminApi';
import { AccionesCodigoEntrega } from './AccionesCodigoEntrega';

type Props = {
  novedad: NovedadAbierta;
  onVolver: () => void;
  /** La novedad se resolvió (Resolver / Aprobar / Rechazar) — la lista
   * debe recargarse y este detalle ya no tiene sentido mostrarlo. */
  onResuelta: () => void;
};

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

/**
 * Detalle de un caso de Novedades (HU-07 ronda 3/4) — se abre al hacer
 * click en una fila de `NovedadesTab`, mismo patrón "reemplaza la lista
 * en el mismo lugar, ← Volver" que ya usan `PedidoDetalle`
 * (`PedidosTab`), `DomiciliariosTab` y `UsuariosTab`.
 *
 * Trae el contexto completo del pedido (`obtenerDetallePedidoAdmin`,
 * mismo endpoint que usa Pedidos) para poder mostrar los datos de
 * contacto de Paciente/Domiciliario en cualquier tipo de caso — la
 * `novedad` en sí ya la tiene el padre, no hace falta refetch de eso.
 */
export function NovedadDetalle({ novedad, onVolver, onResuelta }: Props) {
  const { estado } = useAuth();
  const [pedido, setPedido] = useState<DetallePedidoAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; label: string } | null>(
    null,
  );

  useEffect(() => {
    if (estado.tipo !== 'autenticado') return;
    obtenerDetallePedidoAdmin(estado.accessToken, novedad.solicitudId)
      .then(setPedido)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novedad.solicitudId]);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  async function ejecutar(accion: () => Promise<{ message: string }>) {
    setProcesando(true);
    setError(null);
    try {
      await accion();
      onResuelta();
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

  const proponeMedicamentosOReceta =
    novedad.tipo === 'edicion' &&
    (!!novedad.datosPropuestos?.medicamentos || !!novedad.recetaPropuestaUrl);

  // HU-07 (ronda 5) — "pedido con el cambio aplicado": cada campo usa
  // lo propuesto si el paciente lo pidió, si no cae al valor actual —
  // así la columna de la derecha siempre muestra el pedido completo,
  // no solo lo que cambió. `resaltar*` marca qué campo es el que
  // realmente cambió, en ambas columnas.
  const resaltarDireccionEntrega = !!novedad.datosPropuestos?.direccionEntrega;
  const resaltarDireccionFarmacia = !!novedad.datosPropuestos?.direccionFarmacia;
  const resaltarMedicamentos = !!novedad.datosPropuestos?.medicamentos;
  const resaltarReceta = !!novedad.recetaPropuestaUrl;

  const direccionEntregaPropuesta = novedad.datosPropuestos?.direccionEntrega ?? pedido?.direccionEntrega ?? null;
  const direccionFarmaciaPropuesta = novedad.datosPropuestos?.direccionFarmacia ?? pedido?.direccionFarmacia ?? null;
  const medicamentosPropuestos = novedad.datosPropuestos?.medicamentos ?? pedido?.medicamentos ?? [];
  const recetaActualUrl = novedad.recetaActualUrl ?? pedido?.recetaUrl ?? null;
  const recetaPropuestaUrl = novedad.recetaPropuestaUrl ?? recetaActualUrl;

  return (
    <div className="lp-novedades-wrapper">
      <div className="lp-novedades-content">
        <button type="button" className="lp-novedades-btn lp-novedades-btn-secondary" onClick={onVolver}>
          ← Volver a Novedades
        </button>

        {error ? <Alert tono="error">{error}</Alert> : null}

        <div className="lp-novedades-header">
          <div className="lp-novedades-header-left">
            <h1 className="lp-novedades-title">{novedad.codigoPedido ?? 'Pedido'}</h1>
            <p className="lp-novedades-subtitle">
              <span className={`admin-tag admin-tag--${novedad.tipo}`}>
                {ETIQUETAS_TIPO[novedad.tipo]}
              </span>{' '}
              · Reportada por {ETIQUETAS_ORIGEN[novedad.origen]} ({novedad.reportadaPorCorreo}) el{' '}
              {formatearFechaHora(novedad.creadoEn)}
            </p>
          </div>
        </div>

        <div className="lp-novedades-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="lp-novedades-card-detalle">{novedad.detalle}</div>
        </div>

        {novedad.tipo === 'pregunta' || novedad.tipo === 'codigo' ? (
          <div className="lp-pedidos-detalle-grid">
            {pedido ? (
              <>
                <PacienteCard paciente={pedido.paciente} direccionEntrega={pedido.direccionEntrega} />
                <DomiciliarioCard
                  domiciliario={pedido.domiciliario}
                  direccionFarmacia={pedido.direccionFarmacia}
                />
              </>
            ) : (
              <p className="admin-muted">Cargando datos de contacto…</p>
            )}
          </div>
        ) : null}

        {novedad.tipo === 'pregunta' ? (
          <button
            type="button"
            className="lp-novedades-btn lp-novedades-btn-primary"
            onClick={() => ejecutar(() => resolverNovedad(accessToken, novedad.id))}
            disabled={procesando}
          >
            {procesando ? 'Resolviendo…' : 'Resolver'}
          </button>
        ) : null}

        {novedad.tipo === 'codigo' ? (
          <AccionesCodigoEntrega
            codigoEntrega={novedad.codigoEntrega}
            regenerando={procesando}
            reenviando={procesando}
            onRegenerar={() =>
              ejecutar(() => regenerarCodigoEntrega(accessToken, novedad.solicitudId))
            }
            onReenviar={() =>
              ejecutar(() => reenviarCodigoEntregaCorreo(accessToken, novedad.solicitudId))
            }
          />
        ) : null}

        {novedad.tipo === 'edicion' ? (
          <>
            {/* HU-07 (ronda 5) — pedido completo, actual y con el
                cambio aplicado, lado a lado dentro de UN solo
                contenedor con scroll (no dos independientes) para que
                las dos columnas bajen exactamente igual al comparar. */}
            {pedido ? (
              <div className="lp-novedades-comparacion-scroll">
                <div className="lp-novedades-comparacion-grid">
                  <div className="lp-novedades-comparacion-columna">
                    <h2 className="lp-novedades-comparacion-columna-titulo">Pedido actual</h2>
                    <PacienteCard
                      paciente={pedido.paciente}
                      direccionEntrega={pedido.direccionEntrega}
                      resaltarDireccion={resaltarDireccionEntrega}
                    />
                    <DomiciliarioCard
                      domiciliario={pedido.domiciliario}
                      direccionFarmacia={pedido.direccionFarmacia}
                      resaltarFarmacia={resaltarDireccionFarmacia}
                    />
                    <MedicamentosRecetaCard
                      medicamentos={pedido.medicamentos}
                      recetaUrl={recetaActualUrl}
                      resaltarMedicamentos={resaltarMedicamentos}
                      resaltarReceta={resaltarReceta}
                      recetaGrande
                      onAmpliarReceta={(url) =>
                        setImagenAmpliada({ url, label: 'Receta actual' })
                      }
                    />
                  </div>
                  <div className="lp-novedades-comparacion-columna">
                    <h2 className="lp-novedades-comparacion-columna-titulo">Con el cambio aplicado</h2>
                    <PacienteCard
                      paciente={pedido.paciente}
                      direccionEntrega={direccionEntregaPropuesta}
                      resaltarDireccion={resaltarDireccionEntrega}
                    />
                    <DomiciliarioCard
                      domiciliario={pedido.domiciliario}
                      direccionFarmacia={direccionFarmaciaPropuesta}
                      resaltarFarmacia={resaltarDireccionFarmacia}
                    />
                    <MedicamentosRecetaCard
                      medicamentos={medicamentosPropuestos}
                      recetaUrl={recetaPropuestaUrl}
                      resaltarMedicamentos={resaltarMedicamentos}
                      resaltarReceta={resaltarReceta}
                      recetaGrande
                      onAmpliarReceta={(url) =>
                        setImagenAmpliada({ url, label: 'Receta propuesta' })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="admin-muted">Cargando pedido…</p>
            )}

            {confirmandoRechazo ? (
              <Alert tono="error">
                Si el paciente necesita este cambio, deberá cancelar el pedido y crear uno nuevo — si
                el domiciliario ya llegó a la farmacia, cancelar puede generar un cobro por el
                desplazamiento.
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="lp-novedades-btn lp-novedades-btn-primary"
                    onClick={() => {
                      setConfirmandoRechazo(false);
                      ejecutar(() => rechazarEdicionNovedad(accessToken, novedad.id));
                    }}
                    disabled={procesando}
                  >
                    {procesando ? 'Rechazando…' : 'Confirmar rechazo'}
                  </button>
                  <button
                    type="button"
                    className="lp-novedades-btn lp-novedades-btn-secondary"
                    onClick={() => setConfirmandoRechazo(false)}
                    disabled={procesando}
                  >
                    Cancelar
                  </button>
                </div>
              </Alert>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="lp-novedades-btn lp-novedades-btn-primary"
                  onClick={() => ejecutar(() => aprobarEdicionNovedad(accessToken, novedad.id))}
                  disabled={procesando}
                >
                  {procesando ? 'Aplicando…' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  className="lp-novedades-btn lp-novedades-btn-secondary"
                  onClick={() =>
                    proponeMedicamentosOReceta
                      ? setConfirmandoRechazo(true)
                      : ejecutar(() => rechazarEdicionNovedad(accessToken, novedad.id))
                  }
                  disabled={procesando}
                >
                  {procesando ? 'Rechazando…' : 'Rechazar'}
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {imagenAmpliada ? (
        <ImageLightbox
          url={imagenAmpliada.url}
          label={imagenAmpliada.label}
          onClose={() => setImagenAmpliada(null)}
        />
      ) : null}
    </div>
  );
}
