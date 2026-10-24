import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangleIcon,
  MopedIcon,
  PackageIcon,
  PersonIcon,
  SettingsIcon,
  ShieldIcon,
  StoreIcon,
  UsersIcon,
  WalletIcon,
} from '../../shared/components/icons';
import { useAuth } from '../usuarios/hooks/useAuth';
import { TemaProvider } from '../../shared/hooks/TemaProvider';
import './admin.css';
import { Sidebar, type SidebarItem } from './components/Sidebar';
import { ComportamientoDomiciliariosTab } from './tabs/ComportamientoDomiciliariosTab';
import { ConfiguracionTab } from './tabs/ConfiguracionTab';
import { DomiciliariosTab } from './tabs/DomiciliariosTab';
import { FarmaciasAliadasTab } from './tabs/FarmaciasAliadasTab';
import { NovedadesTab } from './tabs/NovedadesTab';
import { PagosTab } from './tabs/PagosTab';
import { PedidosTab } from './tabs/PedidosTab';
import { PerfilTab } from './tabs/PerfilTab';
import { UsuariosTab } from './tabs/UsuariosTab';

type TabKey =
  | 'pedidos'
  | 'novedades'
  | 'domiciliarios'
  | 'comportamiento'
  | 'usuarios'
  | 'configuracion'
  | 'farmaciasAliadas'
  | 'pagos'
  | 'perfil';

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
    { key: 'comportamiento', label: 'Comportamiento', icon: <ShieldIcon /> },
    { key: 'usuarios', label: 'Usuarios', icon: <UsersIcon /> },
    { key: 'configuracion', label: 'Configuración', icon: <SettingsIcon /> },
    { key: 'farmaciasAliadas', label: 'Farmacias aliadas', icon: <StoreIcon /> },
    { key: 'pagos', label: 'Pagos y billeteras', icon: <WalletIcon /> },
    { key: 'perfil', label: 'Mi perfil', icon: <PersonIcon /> },
  ];

  return (
    <TemaProvider>
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
            <div style={{ display: tab === 'comportamiento' ? 'block' : 'none' }}>
              {visited.has('comportamiento') ? <ComportamientoDomiciliariosTab /> : null}
            </div>
            <div style={{ display: tab === 'usuarios' ? 'block' : 'none' }}>
              {visited.has('usuarios') ? <UsuariosTab /> : null}
            </div>
            <div style={{ display: tab === 'configuracion' ? 'block' : 'none' }}>
              {visited.has('configuracion') ? <ConfiguracionTab /> : null}
            </div>
            <div style={{ display: tab === 'farmaciasAliadas' ? 'block' : 'none' }}>
              {visited.has('farmaciasAliadas') ? <FarmaciasAliadasTab /> : null}
            </div>
            <div style={{ display: tab === 'pagos' ? 'block' : 'none' }}>
              {visited.has('pagos') ? <PagosTab /> : null}
            </div>
            <div style={{ display: tab === 'perfil' ? 'block' : 'none' }}>
              {visited.has('perfil') ? <PerfilTab /> : null}
            </div>
          </div>
        </main>
      </div>
    </TemaProvider>
  );
}