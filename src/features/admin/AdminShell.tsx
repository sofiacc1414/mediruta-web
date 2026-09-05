import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangleIcon, MopedIcon, PackageIcon, PersonIcon, UsersIcon } from '../../shared/components/icons';
import { useAuth } from '../usuarios/hooks/useAuth';
import './admin.css';
import { Sidebar, type SidebarItem } from './components/Sidebar';
import { DomiciliariosTab } from './tabs/DomiciliariosTab';
import { NovedadesTab } from './tabs/NovedadesTab';
import { PedidosTab } from './tabs/PedidosTab';
import { PerfilTab } from './tabs/PerfilTab';
import { UsuariosTab } from './tabs/UsuariosTab';

type TabKey = 'pedidos' | 'novedades' | 'domiciliarios' | 'usuarios' | 'perfil';

const ETIQUETAS_ROL: Record<string, string> = {
  ROOT: 'Root',
  ADMINISTRADOR: 'Administrador',
};

export function AdminShell() {
  const { estado, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('pedidos');
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['pedidos']));
  
  // >>> SE CARGA LA IMAGEN FIJA PARA EL SIDEBAR <<<
  const [fotoPerfilUrl] = useState<string | null>('/images/ADMINISTRADORA.jpg');

  if (estado.tipo !== 'autenticado') return null;

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
    { key: 'pedidos', label: 'Pedidos', icon: <PackageIcon /> },
    { key: 'novedades', label: 'Novedades', icon: <AlertTriangleIcon /> },
    { key: 'domiciliarios', label: 'Domiciliarios', icon: <MopedIcon /> },
    { key: 'usuarios', label: 'Usuarios', icon: <UsersIcon /> },
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
        fotoPerfilUrl={fotoPerfilUrl} // >>> SE ENVÍA LA IMAGEN <<<
        onLogout={onLogout}
      />
      <main className="admin-content">
        <div className="admin-content-inner">
          <div style={{ display: tab === 'pedidos' ? 'block' : 'none' }}>
            {visited.has('pedidos') ? <PedidosTab /> : null}
          </div>
          <div style={{ display: tab === 'novedades' ? 'block' : 'none' }}>
            {visited.has('novedades') ? <NovedadesTab /> : null}
          </div>
          <div style={{ display: tab === 'domiciliarios' ? 'block' : 'none' }}>
            {visited.has('domiciliarios') ? <DomiciliariosTab /> : null}
          </div>
          <div style={{ display: tab === 'usuarios' ? 'block' : 'none' }}>
            {visited.has('usuarios') ? <UsuariosTab /> : null}
          </div>
          <div style={{ display: tab === 'perfil' ? 'block' : 'none' }}>
            {visited.has('perfil') ? <PerfilTab /> : null}
          </div>
        </div>
      </main>
    </div>
  );
}