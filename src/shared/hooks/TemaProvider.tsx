import { useEffect, useState, type ReactNode } from 'react';
import { TemaContext } from './temaContext';

const CLAVE_STORAGE = 'mediruta_modo_oscuro';

function leerPreferenciaGuardada(): boolean {
  try {
    return localStorage.getItem(CLAVE_STORAGE) === 'true';
  } catch {
    return false;
  }
}

/** Modo oscuro — SOLO para el panel admin (ver dónde se monta en
 * `AdminShell`); las pantallas previas al login siempre quedan en claro. */
export function TemaProvider({ children }: { children: ReactNode }) {
  const [oscuro, setOscuro] = useState(leerPreferenciaGuardada);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', oscuro ? 'dark' : 'light');
    try {
      localStorage.setItem(CLAVE_STORAGE, String(oscuro));
    } catch {
      // localStorage puede no estar disponible (modo privado, etc.) — no es crítico.
    }
  }, [oscuro]);

  // Al desmontar (al salir de /admin) se restaura claro para el resto de la app.
  useEffect(() => {
    return () => {
      document.documentElement.setAttribute('data-theme', 'light');
    };
  }, []);

  function alternar() {
    setOscuro((valor) => !valor);
  }

  return <TemaContext.Provider value={{ oscuro, alternar }}>{children}</TemaContext.Provider>;
}
