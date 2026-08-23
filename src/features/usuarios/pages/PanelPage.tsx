import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import { CheckCircleIcon } from '../../../shared/components/icons';
import { useAuth } from '../hooks/useAuth';

/** Panel post-login. Todavía no hay historias de solicitudes/pedidos-entrega
 * implementadas — se agregan acá a medida que se completan. */
export function PanelPage() {
  const { estado, logout } = useAuth();
  const navigate = useNavigate();

  if (estado.tipo !== 'autenticado') return null;

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          background: 'var(--color-white)',
          padding: 'var(--space-8)',
          borderRadius: 24,
          boxShadow: '0 4px 24px rgba(47, 65, 86, 0.12)',
        }}
      >
        <IconBadge icon={<CheckCircleIcon />} />
        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>MediRuta — Panel</h1>
        <p style={{ textAlign: 'center' }}>Hola, {estado.usuario.correo}</p>
        <p style={{ color: 'var(--color-teal)', textAlign: 'center' }}>
          Roles: {estado.usuario.roles.map((r) => `${r.codigo} (${r.estado})`).join(', ')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
          <Button onClick={() => navigate('/domiciliarios')}>Validar domiciliarios</Button>
          <Button variante="secondary" onClick={() => navigate('/cambiar-contrasena')}>
            Cambiar contraseña
          </Button>
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
      </div>
    </main>
  );
}
