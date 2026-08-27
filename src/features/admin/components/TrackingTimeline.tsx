import type { EstadoPedido, EventoHistorial } from '../api/pedidosAdminApi';

const PASOS: EstadoPedido[] = [
  'pendiente_revision',
  'en_asignacion',
  'asignado_en_camino_farmacia',
  'medicamentos_recogidos',
  'en_camino_entrega',
  'en_sitio',
  'entregado',
];

const ETIQUETAS: Record<string, string> = {
  pendiente_revision: 'Pedido generado',
  en_asignacion: 'Buscando domiciliario',
  asignado_en_camino_farmacia: 'Domiciliario en camino a la farmacia',
  medicamentos_recogidos: 'Medicamentos recogidos',
  en_camino_entrega: 'En camino de entrega',
  en_sitio: 'En sitio',
  entregado: 'Entregado',
};

function formatearFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Los 7 pasos del pedido (HU-07/HU-09) — punto relleno navy si ya pasó,
 * outline sky-blue si no, línea conectora, etiqueta + hora tomada del
 * historial real. Mismo criterio que `AppTrackingTimeline` de la App
 * Flutter, para que el admin vea exactamente lo mismo que ve el
 * Paciente/Domiciliario. */
export function TrackingTimeline({
  estadoActual,
  historial,
}: {
  estadoActual: EstadoPedido;
  historial: EventoHistorial[];
}) {
  if (estadoActual === 'cancelada' || estadoActual === 'borrador') {
    return null;
  }

  const indiceActual = PASOS.indexOf(estadoActual);
  const fechaPara = (estado: EstadoPedido) => historial.find((e) => e.estado === estado)?.creadoEn;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {PASOS.map((paso, indice) => {
        const alcanzado = indiceActual >= 0 && indice <= indiceActual;
        const esUltimo = indice === PASOS.length - 1;
        const fecha = fechaPara(paso);

        return (
          <div key={paso} style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: alcanzado ? 'var(--color-navy)' : 'transparent',
                  border: `2px solid ${alcanzado ? 'var(--color-navy)' : 'var(--color-sky-blue)'}`,
                }}
              />
              {!esUltimo ? (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 28,
                    background: alcanzado && indice < indiceActual ? 'var(--color-navy)' : 'var(--color-sky-blue)',
                  }}
                />
              ) : null}
            </div>
            <div style={{ paddingBottom: esUltimo ? 0 : 'var(--space-3)' }}>
              <div
                style={{
                  fontWeight: alcanzado ? 700 : 500,
                  color: alcanzado ? 'var(--color-navy)' : 'var(--color-teal)',
                  fontSize: '0.9rem',
                }}
              >
                {ETIQUETAS[paso]}
              </div>
              {fecha ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-teal)' }}>
                  {formatearFechaHora(fecha)}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
