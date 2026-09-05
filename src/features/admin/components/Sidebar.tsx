import type { ReactNode } from 'react';
import { LogoutIcon } from '../../../shared/components/icons';

export type SidebarItem<TKey extends string> = {
  key: TKey;
  label: string;
  icon: ReactNode;
};

type Props<TKey extends string> = {
  items: SidebarItem<TKey>[];
  activo: TKey;
  onSelect: (key: TKey) => void;
  correo: string;
  rolPrincipal: string;
  fotoPerfilUrl: string | null;
  onLogout: () => void;
};

/** Sidebar del panel admin — a la vez el menú de navegación Y la lista
 * de tabs (cada ítem cambia la sección activa, nunca navega a otra
 * ruta — ver `AdminShell`, que preserva el estado de cada sección al
 * cambiar entre ellas). En pantallas angostas se convierte en una
 * barra horizontal (ver admin.css). */
export function Sidebar<TKey extends string>({
  items,
  activo,
  onSelect,
  correo,
  rolPrincipal,
  fotoPerfilUrl,
  onLogout,
}: Props<TKey>) {
  const inicial = correo.trim().charAt(0).toUpperCase() || '?';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        {/* >>> AQUÍ SE PONE EL LOGO EN BLANCO <<< */}
        <img 
          src="/images/LogoEnBlanco.png" 
          alt="MediRuta" 
          className="admin-sidebar-logo"
        />
      </div>

      <nav className="admin-nav">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="admin-nav-item"
            data-activo={item.key === activo}
            onClick={() => onSelect(item.key)}
            aria-current={item.key === activo ? 'page' : undefined}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="admin-account">
        <div className="admin-avatar-circle" aria-hidden>
          {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt="" /> : inicial}
        </div>
        <div className="admin-account-text">
          <span className="admin-account-correo">{correo}</span>
          <span className="admin-account-rol">{rolPrincipal}</span>
        </div>
        <button
          type="button"
          className="admin-logout-button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}