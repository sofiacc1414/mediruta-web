import { useId, type InputHTMLAttributes } from 'react';

/**
 * Input reutilizable con label y estados normal/focus/disabled/error
 * (DOCS/context.md, Parte A, secciones 15 y 23).
 */
type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  errorText?: string;
};

export function Input({ label, errorText, id, style, ...resto }: Props) {
  const idGenerado = useId();
  const inputId = id ?? idGenerado;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
      <label htmlFor={inputId} style={{ fontSize: '0.875rem', color: 'var(--color-navy)' }}>
        {label}
      </label>
      <input
        id={inputId}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 8,
          borderWidth: errorText ? 2 : 1,
          borderStyle: 'solid',
          borderColor: 'var(--color-navy)',
          background: 'var(--color-white)',
          color: 'var(--color-navy)',
          ...style,
        }}
        aria-invalid={Boolean(errorText)}
        {...resto}
      />
      {errorText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-navy)', fontWeight: 600 }}>
          ⚠ {errorText}
        </span>
      ) : null}
    </div>
  );
}
