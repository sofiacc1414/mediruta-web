// Tarjetas de Paciente/Domiciliario + miniatura de documento —
// extraídas de `PedidosTab.tsx` (donde vivían como componentes
// privados dentro de `PedidoDetalle`) para reusarlas también en
// `NovedadDetalle.tsx` (pestaña Novedades) sin duplicar la
// implementación (context.md Parte A, §23/24).
//
// Los estilos (`lp-pedidos-detalle-card*`, `lp-pedidos-miniatura*`)
// siguen viviendo en `PedidosTab.css` — se importa acá también porque
// las clases son globales y no dependen de qué tab las use; separarlas
// a su propio CSS queda para una limpieza aparte, no cambia nada del
// resultado visual.
import type { Medicamento } from '../api/pedidosAdminApi';
import '../tabs/PedidosTab.css';

type PacienteResumen = {
  nombre: string | null;
  correo: string;
  telefono: string | null;
  cedulaFrenteUrl: string | null;
  cedulaReversoUrl: string | null;
};

export function PacienteCard({
  paciente,
  direccionEntrega,
  resaltarDireccion = false,
}: {
  paciente: PacienteResumen;
  direccionEntrega: string | null;
  /** HU-07 (ronda 5) — resalta la línea de dirección cuando es el dato
   * que el paciente pidió corregir (comparación en `NovedadDetalle`). */
  resaltarDireccion?: boolean;
}) {
  return (
    <div className="lp-pedidos-detalle-card">
      <h3 className="lp-pedidos-detalle-card-titulo">👤 Paciente</h3>
      <p className="lp-pedidos-detalle-card-nombre">{paciente.nombre ?? '—'}</p>
      <p className="lp-pedidos-detalle-card-correo">{paciente.correo}</p>
      <p className="lp-pedidos-detalle-card-telefono">{paciente.telefono ?? 'Sin teléfono'}</p>
      <p className={`lp-pedidos-detalle-card-direccion${resaltarDireccion ? ' lp-resaltado' : ''}`}>
        📍 Dirección: {direccionEntrega ?? '—'}
      </p>
      <div className="lp-pedidos-detalle-card-docs">
        <MiniaturaDoc etiqueta="Cédula (frente)" url={paciente.cedulaFrenteUrl} />
        <MiniaturaDoc etiqueta="Cédula (reverso)" url={paciente.cedulaReversoUrl} />
      </div>
    </div>
  );
}

type DomiciliarioResumen = {
  nombre: string | null;
  correo: string;
  telefono: string | null;
} | null;

export function DomiciliarioCard({
  domiciliario,
  direccionFarmacia,
  resaltarFarmacia = false,
}: {
  domiciliario: DomiciliarioResumen;
  direccionFarmacia: string | null;
  resaltarFarmacia?: boolean;
}) {
  return (
    <div className="lp-pedidos-detalle-card">
      <h3 className="lp-pedidos-detalle-card-titulo">🛵 Domiciliario</h3>
      {domiciliario ? (
        <>
          <p className="lp-pedidos-detalle-card-nombre">{domiciliario.nombre ?? '—'}</p>
          <p className="lp-pedidos-detalle-card-correo">{domiciliario.correo}</p>
          <p className="lp-pedidos-detalle-card-telefono">{domiciliario.telefono ?? 'Sin teléfono'}</p>
        </>
      ) : (
        <p className="lp-pedidos-detalle-card-sin">Todavía sin asignar</p>
      )}
      <p className={`lp-pedidos-detalle-card-farmacia${resaltarFarmacia ? ' lp-resaltado' : ''}`}>
        🏪 Farmacia: {direccionFarmacia ?? '—'}
      </p>
    </div>
  );
}

/**
 * HU-07 (ronda 5) — extraído de `PedidoDetalle` (vivía inline en
 * `PedidosTab.tsx`) para reusarlo también en la comparación completa
 * de `NovedadDetalle.tsx`. `recetaGrande`/`onAmpliarReceta` son solo
 * para esa comparación — sin pasarlos, se ve idéntico a como ya se
 * veía en Pedidos (miniatura de 64px, abre en pestaña nueva).
 */
export function MedicamentosRecetaCard({
  medicamentos,
  recetaUrl,
  resaltarMedicamentos = false,
  resaltarReceta = false,
  recetaGrande = false,
  onAmpliarReceta,
}: {
  medicamentos: Medicamento[];
  recetaUrl: string | null;
  resaltarMedicamentos?: boolean;
  resaltarReceta?: boolean;
  recetaGrande?: boolean;
  onAmpliarReceta?: (url: string) => void;
}) {
  return (
    <div className="lp-pedidos-detalle-card">
      <h3 className="lp-pedidos-detalle-card-titulo">💊 Medicamentos</h3>
      <div className={resaltarMedicamentos ? 'lp-resaltado' : undefined}>
        {medicamentos.length === 0 ? (
          <p className="lp-pedidos-detalle-card-sin">Ninguno cargado</p>
        ) : (
          <div className="lp-pedidos-detalle-medicamentos">
            {medicamentos.map((m, i) => (
              <div key={i} className="lp-pedidos-detalle-medicamento">
                <span className="lp-pedidos-detalle-medicamento-nombre">{m.nombre ?? 'Sin nombre'}</span>
                <span className="lp-pedidos-detalle-medicamento-detalle">
                  {[m.concentracion, m.formaFarmaceutica, m.cantidad].filter(Boolean).join(' · ')}
                </span>
                {m.posologia && (
                  <span className="lp-pedidos-detalle-medicamento-posologia">Posología: {m.posologia}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className={resaltarReceta ? 'lp-resaltado' : undefined}
        style={{ marginTop: '8px', display: 'block' }}
      >
        <MiniaturaDoc
          etiqueta="Foto de la receta"
          url={recetaUrl}
          grande={recetaGrande}
          onAmpliar={onAmpliarReceta}
        />
      </div>
    </div>
  );
}

export function MiniaturaDoc({
  etiqueta,
  url,
  grande = false,
  onAmpliar,
}: {
  etiqueta: string;
  url: string | null;
  /** HU-07 (ronda 5) — imagen inline grande (~320px) en vez de la
   * miniatura de 64px, para que el admin pueda leer texto escrito en
   * el documento sin depender de abrirlo aparte. */
  grande?: boolean;
  /** Si viene, un click amplía en el lightbox en vez de abrir una
   * pestaña nueva (usado junto con `grande`). */
  onAmpliar?: (url: string) => void;
}) {
  const claseImg = `lp-pedidos-miniatura-img${grande ? ' lp-pedidos-miniatura-img--grande' : ''}`;
  return (
    <div className={`lp-pedidos-miniatura${grande ? ' lp-pedidos-miniatura--grande' : ''}`}>
      <span className="lp-pedidos-miniatura-label">{etiqueta}</span>
      {url ? (
        onAmpliar ? (
          <button
            type="button"
            className="lp-pedidos-miniatura-link"
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            onClick={() => onAmpliar(url)}
          >
            <img src={url} alt={etiqueta} className={claseImg} />
          </button>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="lp-pedidos-miniatura-link">
            <img src={url} alt={etiqueta} className={claseImg} />
          </a>
        )
      ) : (
        <div
          className={`lp-pedidos-miniatura-empty${grande ? ' lp-pedidos-miniatura-empty--grande' : ''}`}
        >
          No subida
        </div>
      )}
    </div>
  );
}
