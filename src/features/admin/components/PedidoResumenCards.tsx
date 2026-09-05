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
}: {
  paciente: PacienteResumen;
  direccionEntrega: string | null;
}) {
  return (
    <div className="lp-pedidos-detalle-card">
      <h3 className="lp-pedidos-detalle-card-titulo">👤 Paciente</h3>
      <p className="lp-pedidos-detalle-card-nombre">{paciente.nombre ?? '—'}</p>
      <p className="lp-pedidos-detalle-card-correo">{paciente.correo}</p>
      <p className="lp-pedidos-detalle-card-telefono">{paciente.telefono ?? 'Sin teléfono'}</p>
      <p className="lp-pedidos-detalle-card-direccion">📍 Dirección: {direccionEntrega ?? '—'}</p>
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
}: {
  domiciliario: DomiciliarioResumen;
  direccionFarmacia: string | null;
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
      <p className="lp-pedidos-detalle-card-farmacia">🏪 Farmacia: {direccionFarmacia ?? '—'}</p>
    </div>
  );
}

export function MiniaturaDoc({ etiqueta, url }: { etiqueta: string; url: string | null }) {
  return (
    <div className="lp-pedidos-miniatura">
      <span className="lp-pedidos-miniatura-label">{etiqueta}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="lp-pedidos-miniatura-link">
          <img src={url} alt={etiqueta} className="lp-pedidos-miniatura-img" />
        </a>
      ) : (
        <div className="lp-pedidos-miniatura-empty">No subida</div>
      )}
    </div>
  );
}
