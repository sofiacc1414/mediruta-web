import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

type Props = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

/** Envuelve una sección/elemento con la animación de scroll de landing.css. */
export function Reveal({ children, className, delayMs }: Props) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal${className ? ` ${className}` : ''}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
