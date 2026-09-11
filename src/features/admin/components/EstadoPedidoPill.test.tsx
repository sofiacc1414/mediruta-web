import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EstadoPedidoPill } from './EstadoPedidoPill';

describe('EstadoPedidoPill', () => {
  it('en_asignacion muestra "Buscando domiciliario"', () => {
    render(<EstadoPedidoPill estado="en_asignacion" />);
    expect(screen.getByText('Buscando domiciliario')).toBeInTheDocument();
  });

  it('entregado muestra "Entregado"', () => {
    render(<EstadoPedidoPill estado="entregado" />);
    expect(screen.getByText('Entregado')).toBeInTheDocument();
  });

  it('cancelada muestra "Cancelada"', () => {
    render(<EstadoPedidoPill estado="cancelada" />);
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('cada estado tiene una etiqueta propia (mismo mapeo que AppStatusPill de la App)', () => {
    const estados: Array<[string, string]> = [
      ['borrador', 'Borrador'],
      ['pendiente_revision', 'Pedido generado'],
      ['asignado_en_camino_farmacia', 'En camino a la farmacia'],
      ['medicamentos_recogidos', 'Medicamentos recogidos'],
      ['en_camino_entrega', 'En camino de entrega'],
      ['en_sitio', 'En el sitio'],
    ];

    for (const [estado, etiqueta] of estados) {
      const { unmount } = render(<EstadoPedidoPill estado={estado as never} />);
      expect(screen.getByText(etiqueta)).toBeInTheDocument();
      unmount();
    }
  });
});
