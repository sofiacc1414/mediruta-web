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
      <div className="lp-container">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                background: 'var(--lp-teal)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFEFF',
                fontWeight: 700,
                fontSize: '1.2rem'
              }}>
                M
              </div>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 700 }}>
                Medi<span style={{ color: 'var(--lp-teal)' }}>Ruta</span>
              </span>
            </div>
            <p>Conectamos pacientes con domiciliarios para entregar medicamentos de forma segura y rápida.</p>
          </div>
          
          <div className="lp-footer-col">
            <h4>Navegación</h4>
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
          
          <div className="lp-footer-col">
            <h4>Producto</h4>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#quienes-somos">Quiénes somos</a>
          </div>
          
          <div className="lp-footer-col">
            <h4>Contacto</h4>
            <a href="mailto:contacto@mediruta.app">contacto@mediruta.app</a>
            <a href="#">Soporte</a>
            <a href="#">Términos y condiciones</a>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} MediRuta. Todos los derechos reservados.</span>
          <div className="lp-footer-social">
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="Instagram">📸</a>
            <a href="#" aria-label="LinkedIn">💼</a>
            <a href="#" aria-label="GitHub">🐙</a>
          </div>
        </div>
      </div>
    </footer>
  );
}