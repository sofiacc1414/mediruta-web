import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, ShieldIcon } from '../../../shared/components/icons';
import { PhoneMockup, TrackingScreen } from './PhoneMockup';
import { Reveal } from './Reveal';

const TRUST_ITEMS = [
  { icon: <ShieldIcon />, texto: 'Entregas seguras' },
  { icon: <ClockIcon />, texto: 'Seguimiento en tiempo real' },
  { icon: <CheckCircleIcon />, texto: 'Proceso transparente' },
];

export function Hero({ apkUrl }: { apkUrl: string }) {
  const navigate = useNavigate();

  return (
    <section className="lp-hero">
      <div className="lp-shell lp-hero-grid">
        <div>
          <Reveal>
            <span className="lp-eyebrow">Entrega de medicamentos</span>
            <h1 className="lp-hero-title">
              Tu medicamento,
              <br />
              <em>contigo y a tiempo.</em>
            </h1>
            <p className="lp-hero-sub">
              Conectamos pacientes con domiciliarios que recogen sus medicamentos en la farmacia
              y los llevan hasta la puerta de su hogar.
            </p>
            <div className="lp-hero-ctas">
              <a href={apkUrl} className="lp-btn lp-btn-primary">
                Descargar la app
              </a>
              <button type="button" className="lp-btn lp-btn-secondary" onClick={() => navigate('/login')}>
                Soy administrador
              </button>
            </div>
            <div className="lp-trust-row">
              {TRUST_ITEMS.map((item) => (
                <span key={item.texto} className="lp-trust-item">
                  {item.icon}
                  {item.texto}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delayMs={120}>
          <div className="lp-visual-stage">
            <div className="lp-visual-blob" aria-hidden />
            <PhoneMockup>
              <TrackingScreen />
            </PhoneMockup>
            <div className="lp-float-card top">
              <span className="lp-float-icon">
                <CheckCircleIcon />
              </span>
              Receta validada
            </div>
            <div className="lp-float-card bottom">
              <span className="lp-float-icon">
                <ClockIcon />
              </span>
              Domiciliario en camino
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
