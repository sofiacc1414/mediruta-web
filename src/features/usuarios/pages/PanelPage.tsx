import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../hooks/useAuth';

/** Placeholder post-login — todavía no hay más historias implementadas
 * (solicitudes/domiciliarios/pedidos-entrega). Sirve para probar G06/G07
 * desde una sesión real. Se reemplaza cuando se implemente la siguiente
 * historia de Administrador. */
export function PanelPage() {
  const { estado, logout } = useAuth();
  const navigate = useNavigate();

  if (estado.tipo !== 'autenticado') return null;

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
      }}
    >
      <h1>MediRuta — Panel</h1>
      <p>Hola, {estado.usuario.correo}</p>
      <p style={{ color: 'var(--color-teal)' }}>
        Roles: {estado.usuario.roles.map((r) => `${r.codigo} (${r.estado})`).join(', ')}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button onClick={() => navigate('/cambiar-contrasena')}>Cambiar contraseña</Button>
        <Button
          variante="secondary"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    </main>
  );
}
