import type { CSSProperties } from 'react';
import type { EstadoPedido } from '../api/pedidosAdminApi';

/** Mismo criterio que `AppStatusPill` de la App Flutter: los estados se
 * distinguen por relleno/borde + texto, nunca por un color fuera de la
 * paleta oficial — nada de verde/rojo/naranja "semántico". */
const ETIQUETAS: Record<EstadoPedido, string> = {
  borrador: 'Borrador',
  pendiente_revision: 'Pedido generado',
  en_asignacion: 'Buscando domiciliario',
  asignado_en_camino_farmacia: 'En camino a la farmacia',
  medicamentos_recogidos: 'Medicamentos recogidos',
  en_camino_entrega: 'En camino de entrega',
  en_sitio: 'En el sitio',
  entregado: 'Entregado',
  cancelada: 'Cancelada',
};

function estilo(estado: EstadoPedido): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.75rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  switch (estado) {
    case 'asignado_en_camino_farmacia':
    case 'medicamentos_recogidos':
      return { ...base, background: 'var(--color-teal)', color: 'var(--color-white)' };
    case 'en_camino_entrega':
    case 'en_sitio':
      return { ...base, background: 'var(--color-navy)', color: 'var(--color-white)' };
    case 'entregado':
      return { ...base, background: 'var(--color-beige)', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)' };
    case 'cancelada':
      return { ...base, background: 'transparent', color: 'var(--color-teal)', border: '1.5px solid var(--color-teal)' };
    case 'en_asignacion':
      return { ...base, background: 'transparent', color: 'var(--color-navy)', border: '1.5px solid var(--color-sky-blue)' };
    default:
      return { ...base, background: 'transparent', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)' };
  }
}

export function EstadoPedidoPill({ estado }: { estado: EstadoPedido }) {
  return <span style={estilo(estado)}>{ETIQUETAS[estado]}</span>;
}
