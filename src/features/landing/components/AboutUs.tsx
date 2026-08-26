import { CheckCircleIcon, MopedIcon, PinIcon } from '../../../shared/components/icons';
import { Reveal } from './Reveal';

const PILLS = [
  { icon: <CheckCircleIcon />, texto: 'Proceso digital' },
  { icon: <PinIcon />, texto: 'Seguimiento en tiempo real' },
  { icon: <MopedIcon />, texto: 'Entrega en tu puerta' },
];

export function AboutUs() {
  return (
    <section className="lp-section lp-section-white" id="quienes-somos">
      <div className="lp-shell lp-about-grid">
        <Reveal>
          <div className="lp-about-visual">
            <span className="lp-about-visual-ring r1" aria-hidden />
            <span className="lp-about-visual-ring r2" aria-hidden />
            <div className="lp-about-visual-core">
              <MopedIcon />
            </div>
            <div className="lp-about-badge b1">
              <CheckCircleIcon width={16} height={16} style={{ color: 'var(--color-teal)' }} />
              Receta validada
            </div>
            <div className="lp-about-badge b2">
              <PinIcon width={16} height={16} style={{ color: 'var(--color-teal)' }} />
              Entrega confirmada
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="lp-about-text">
            <span className="lp-eyebrow">¿Quiénes somos?</span>
            <h2 className="lp-section-title" style={{ marginBottom: 20 }}>
              Tecnología al servicio de tu salud
            </h2>
            <p>
              MediRuta busca facilitar el acceso a medicamentos combinando tecnología y
              logística: conectamos a quien necesita un medicamento con la farmacia que lo tiene
              y con el domiciliario que lo lleva, todo desde una sola plataforma.
            </p>
            <div className="lp-pill-list">
              {PILLS.map((pill) => (
                <span key={pill.texto} className="lp-pill">
                  {pill.icon}
                  {pill.texto}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
