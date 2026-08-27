import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MopedIcon, PackageIcon, PersonIcon, UsersIcon } from '../../shared/components/icons';
import { useAuth } from '../usuarios/hooks/useAuth';
import './admin.css';
import { Sidebar, type SidebarItem } from './components/Sidebar';
import { DomiciliariosTab } from './tabs/DomiciliariosTab';
import { PedidosTab } from './tabs/PedidosTab';
import { PerfilTab } from './tabs/PerfilTab';
import { UsuariosTab } from './tabs/UsuariosTab';

type TabKey = 'domiciliarios' | 'pedidos' | 'usuarios' | 'perfil';

const ETIQUETAS_ROL: Record<string, string> = {
  ROOT: 'Root',
  ADMINISTRADOR: 'Administrador',
};

/**
 * Panel admin — un solo contenedor navegable por tabs (el sidebar ES
 * la lista de tabs, en vez de un menú que navega a rutas separadas).
 *
 * Requisito crítico: cambiar de tab y volver no debe perder el estado
 * de la tab anterior (filtros, datos ya cargados, texto en inputs). En
 * vez de desmontar el contenido inactivo (lo que harían unos Tabs con
 * renderizado condicional típico), cada sección se queda montada desde
 * la primera vez que se visita (`visited`) y solo se oculta con
 * `display: none` — nunca se vuelve a crear el componente, así que su
 * estado interno (y lo que ya pidió al backend) sigue intacto.
 */
export function AdminShell() {
  const { estado, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('domiciliarios');
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['domiciliarios']));

  if (estado.tipo !== 'autenticado') return null;

  const esRoot = estado.usuario.roles.some((r) => r.codigo === 'ROOT' && r.estado === 'habilitado');
  const rolPrincipal = estado.usuario.roles.find((r) => r.estado === 'habilitado')?.codigo;

  function irA(key: TabKey) {
    setTab(key);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const items: SidebarItem<TabKey>[] = [
    { key: 'domiciliarios', label: 'Domiciliarios', icon: <MopedIcon /> },
    { key: 'pedidos', label: 'Pedidos', icon: <PackageIcon /> },
    ...(esRoot ? [{ key: 'usuarios' as const, label: 'Usuarios', icon: <UsersIcon /> }] : []),
    { key: 'perfil', label: 'Mi perfil', icon: <PersonIcon /> },
  ];

  return (
    <div className="admin-shell">
      <Sidebar
        items={items}
        activo={tab}
        onSelect={irA}
        correo={estado.usuario.correo}
        rolPrincipal={rolPrincipal ? (ETIQUETAS_ROL[rolPrincipal] ?? rolPrincipal) : ''}
        onLogout={onLogout}
      />
      <main className="admin-content">
        <div className="admin-content-inner">
          <div style={{ display: tab === 'domiciliarios' ? 'block' : 'none' }}>
            {visited.has('domiciliarios') ? <DomiciliariosTab /> : null}
          </div>
          <div style={{ display: tab === 'pedidos' ? 'block' : 'none' }}>
            {visited.has('pedidos') ? <PedidosTab /> : null}
          </div>
          {esRoot ? (
            <div style={{ display: tab === 'usuarios' ? 'block' : 'none' }}>
              {visited.has('usuarios') ? <UsuariosTab /> : null}
            </div>
          ) : null}
          <div style={{ display: tab === 'perfil' ? 'block' : 'none' }}>
            {visited.has('perfil') ? <PerfilTab /> : null}
          </div>
        </div>
      </main>
    </div>
  );
}
