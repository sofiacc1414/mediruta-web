import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { MenuIcon } from '../../../shared/components/icons';

const LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#quienes-somos', label: 'Quiénes somos' },
];

export function Navbar() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="lp-nav" id="inicio">
      <div className="lp-shell lp-nav-inner">
        <a href="#inicio" className="lp-logo">
          <img src="/logo-mediruta.png" alt="MediRuta" className="lp-logo-img" />
        </a>

        <nav className="lp-nav-links" aria-label="Navegación principal">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="lp-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-cta">
          <Button
            variante="secondary"
            style={{ width: 'auto', padding: '10px 26px' }}
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </Button>
          <button
            type="button"
            className="lp-nav-menu-btn"
            aria-label="Abrir menú"
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            <MenuIcon width={22} height={22} />
          </button>
        </div>
      </div>

      {abierto ? (
        <div
          className="lp-shell"
          style={{ paddingBottom: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="lp-nav-link"
              onClick={() => setAbierto(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}
