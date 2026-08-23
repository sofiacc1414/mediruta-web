import type { ReactNode } from 'react';

/**
 * Círculo de color con un ícono centrado — mismo componente que
 * `AppIconBadge` en la App Flutter, para consistencia visual entre
 * superficies (context.md, Parte A, sección 22).
 */
type Props = {
  icon: ReactNode;
  size?: number;
  background?: string;
  color?: string;
};

export function IconBadge({
  icon,
  size = 88,
  background = 'var(--color-sky-blue)',
  color = 'var(--color-navy)',
}: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      <div style={{ width: size * 0.45, height: size * 0.45 }}>{icon}</div>
    </div>
  );
}
