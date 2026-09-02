import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="lp-container lp-nav-inner">
        {/* >>> LOGO EN BLANCO <<< */}
        <a href="#inicio" className="lp-logo">
          <img 
            src="/images/LogoEnBlanco.png" 
            alt="MediRuta" 
            className="lp-logo-image"
          />
        </a>

        <nav className="lp-nav-links" aria-label="Navegación principal">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="lp-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-cta">
          <button
            type="button"
            className="lp-btn"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className="lp-nav-menu-btn"
            aria-label="Abrir menú"
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            <MenuIcon width={24} height={24} />
          </button>
        </div>
      </div>

      {abierto && (
        <div className="lp-container" style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="lp-nav-link"
              onClick={() => setAbierto(false)}
              style={{ fontSize: '1.1rem' }}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            className="lp-btn lp-btn-primary"
            style={{ marginTop: 8, width: '100%', justifyContent: 'center', background: 'var(--lp-white)', color: 'var(--lp-navy)' }}
            onClick={() => {
              setAbierto(false);
              navigate('/login');
            }}
          >
            Iniciar sesión
          </button>
        </div>
      )}
    </header>
  );
}