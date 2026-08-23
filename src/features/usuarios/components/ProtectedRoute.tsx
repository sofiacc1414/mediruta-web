import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Exige sesión autenticada (y, por construcción de `AuthProvider`, rol
 * ROOT/ADMINISTRADOR — cualquier otro rol nunca llega a `autenticado`).
 * Mientras se restaura la sesión al abrir el panel, muestra un loading en
 * vez de redirigir de una (evita un parpadeo a /login en cada recarga).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { estado } = useAuth();

  if (estado.tipo === 'cargando') {
    return (
      <div
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-navy)',
        }}
      >
        Cargando…
      </div>
    );
  }

  if (estado.tipo === 'anonimo') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
