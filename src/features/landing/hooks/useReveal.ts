import { useEffect, useRef } from 'react';

/**
 * Revela un elemento (clase `reveal` en landing.css) la primera vez que
 * entra en viewport — animación de scroll discreta y de una sola vez,
 * sin librería nueva. `prefers-reduced-motion` ya lo neutraliza en CSS.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          nodo.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(nodo);
    return () => observer.disconnect();
  }, []);

  return ref;
}
