import { Reveal } from './Reveal';

const BENEFITS = [
  { icon: '🛡️', titulo: 'Seguridad', texto: 'Entregas verificadas con un código único para cada pedido.' },
  { icon: '📍', titulo: 'Seguimiento', texto: 'Mirá en qué paso está tu pedido en cualquier momento.' },
  { icon: '⚡', titulo: 'Rapidez', texto: 'Asignación automática al domiciliario más cercano.' },
  { icon: '🏠', titulo: 'Comodidad', texto: 'Pedí desde donde estés, sin salir de tu casa.' },
  { icon: '👁️', titulo: 'Transparencia', texto: 'Historial completo de cada estado del pedido.' },
  { icon: '🗺️', titulo: 'Cobertura', texto: 'La red de domiciliarios crece con la demanda de tu zona.' },
];

export function Benefits() {
  return (
    <section className="lp-section lp-benefits-section" id="beneficios">
      {/* FONDO CON PARTÍCULAS */}
      <div className="lp-benefits-bg">
        <div className="lp-benefits-particles">
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
          <div className="lp-particle-dot" />
        </div>
        <div className="lp-benefits-glow" />
        <div className="lp-benefits-glow" />
      </div>

      <div className="lp-container">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-section-eyebrow center">Beneficios</span>
            <h2 className="lp-section-title">Pensado para que confíes en el proceso</h2>
            <p className="lp-section-desc">
              Cada característica está diseñada para darte tranquilidad y control
            </p>
          </div>
        </Reveal>

        <div className="lp-benefits-grid">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.titulo} delayMs={i * 80}>
              <div className="lp-benefit-card">
                <div className="lp-benefit-icon-wrap">{b.icon}</div>
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}