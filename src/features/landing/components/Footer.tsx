const LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#quienes-somos', label: 'Quiénes somos' },
  { href: 'mailto:contacto@mediruta.app', label: 'Contacto' },
];

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-shell lp-footer-inner">
        <a href="#inicio" className="lp-logo">
          <img src="/logo-mediruta.png" alt="MediRuta" className="lp-logo-img" style={{ height: 24 }} />
        </a>
        <nav className="lp-footer-links" aria-label="Enlaces del pie de página">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <span className="lp-footer-meta">© {new Date().getFullYear()} MediRuta</span>
      </div>
    </footer>
  );
}
