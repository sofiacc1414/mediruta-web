import type { ButtonHTMLAttributes, CSSProperties } from 'react';

/**
 * Jerarquía de botones oficial (DOCS/context.md, Parte A, secciones 13 y
 * 23): Primary (Navy) / Secondary (borde, fondo blanco).
 */
type Variante = 'primary' | 'secondary';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
};

export function Button({ variante = 'primary', style, disabled, ...resto }: Props) {
  const base: CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    fontWeight: 600,
    width: '100%',
    padding: '14px var(--space-6)',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    border: '1.5px solid var(--color-navy)',
    transition: 'opacity 0.15s ease',
  };

  const variantes: Record<Variante, CSSProperties> = {
    primary: {
      background: 'var(--color-navy)',
      color: 'var(--color-white)',
    },
    secondary: {
      background: 'var(--color-white)',
      color: 'var(--color-navy)',
    },
  };

  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variantes[variante], ...style }}
      {...resto}
    />
  );
}
