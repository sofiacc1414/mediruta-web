import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

/**
 * Input reutilizable con label y estados normal/focus/disabled/error
 * (DOCS/context.md, Parte A, secciones 15 y 23). Estilo *filled* tipo
 * píldora con ícono prefijo, igual que `AppTextField` en la App Flutter.
 * Con `esPassword` agrega su propio toggle de mostrar/ocultar.
 */
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  errorText?: string;
  icon?: ReactNode;
  esPassword?: boolean;
  type?: string;
};

export function Input({ label, errorText, icon, esPassword, id, style, type, ...resto }: Props) {
  const idGenerado = useId();
  const inputId = id ?? idGenerado;
  const [ocultarTexto, setOcultarTexto] = useState(true);

  const tipoReal = esPassword ? (ocultarTexto ? 'password' : 'text') : (type ?? 'text');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left' }}>
      <label htmlFor={inputId} style={{ fontSize: '0.875rem', color: 'var(--color-navy)' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon ? (
          <span
            style={{
              position: 'absolute',
              left: 16,
              width: 20,
              height: 20,
              color: 'var(--color-teal)',
              display: 'flex',
            }}
          >
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          type={tipoReal}
          style={{
            width: '100%',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            padding: '14px 20px',
            paddingLeft: icon ? 46 : 20,
            paddingRight: esPassword ? 46 : 20,
            borderRadius: 'var(--radius-pill)',
            border: `${errorText ? 2 : 1}px solid var(--color-navy)`,
            background: 'var(--color-beige)',
            color: 'var(--color-navy)',
            boxSizing: 'border-box',
            ...style,
          }}
          aria-invalid={Boolean(errorText)}
          {...resto}
        />
        {esPassword ? (
          <button
            type="button"
            onClick={() => setOcultarTexto((v) => !v)}
            aria-label={ocultarTexto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            style={{
              position: 'absolute',
              right: 14,
              width: 22,
              height: 22,
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-teal)',
              cursor: 'pointer',
            }}
          >
            {ocultarTexto ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        ) : null}
      </div>
      {errorText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-navy)', fontWeight: 600 }}>
          ⚠ {errorText}
        </span>
      ) : null}
    </div>
  );
}
