import { useNavigate } from 'react-router-dom';
import { PhoneMockup, TrackingScreen } from './PhoneMockup';
import { Reveal } from './Reveal';

export function Hero({ apkUrl }: { apkUrl: string }) {
  const navigate = useNavigate();

  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" />
      <div className="lp-hero-overlay" />
      <div className="lp-hero-light" />
      <div className="lp-hero-light" />
      
      <div className="lp-container lp-hero-grid">
        <div className="lp-hero-content">
          <Reveal>
            {/* >>> LOGO ELIMINADO <<< */}
            
            <h1 className="lp-hero-title">
              Tu medicamento,
              <br />
              <span className="glow">contigo</span>{' '}
              <span className="highlight">y a tiempo.</span>
            </h1>
            <p className="lp-hero-sub">
              Conectamos pacientes con domiciliarios que recogen sus medicamentos en la farmacia
              y los llevan hasta la puerta de su hogar con total transparencia y trazabilidad.
            </p>
            <div className="lp-hero-ctas">
              <a href={apkUrl} className="lp-btn lp-btn-primary">
                <svg className="lp-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar la app
              </a>
              <button type="button" className="lp-btn lp-btn-secondary" onClick={() => navigate('/login')}>
                Panel administrador
              </button>
            </div>
          </Reveal>
        </div>

        <Reveal delayMs={120}>
          <div className="lp-hero-visual">
            <div className="lp-ring" />
            <div className="lp-ring" />
            <div className="lp-ring" />
            <div className="lp-wave" />
            <div className="lp-wave" />
            <div className="lp-wave" />
            
            {/* >>> LOGO FLOTANTE ELIMINADO <<< */}
            
            <PhoneMockup>
              <TrackingScreen />
            </PhoneMockup>
          </div>
        </Reveal>
      </div>
    </section>
  );
}