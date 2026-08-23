import type { ReactNode } from 'react';

/**
 * Feedback de error/éxito/información dentro de la paleta oficial — sin
 * rojo/verde ni ningún color fuera de Navy/Teal/SkyBlue/Beige/White
 * (DOCS/context.md, Parte A, sección 4: contraste + iconografía + texto).
 */
type Tono = 'error' | 'exito' | 'info';

const ICONOS: Record<Tono, string> = {
  error: '⚠',
  exito: '✓',
  info: 'ℹ',
};

const FONDOS: Record<Tono, string> = {
  error: 'var(--color-sky-blue)',
  exito: 'var(--color-beige)',
  info: 'var(--color-sky-blue)',
};

type Props = {
  tono?: Tono;
  children: ReactNode;
};

export function Alert({ tono = 'info', children }: Props) {
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: 'var(--space-3)',
        borderRadius: 8,
        border: '1.5px solid var(--color-navy)',
        background: FONDOS[tono],
        color: 'var(--color-navy)',
        fontSize: '0.9rem',
      }}
    >
      <span aria-hidden>{ICONOS[tono]}</span>
      <span style={{ fontWeight: 600 }}>{children}</span>
    </div>
  );
}
