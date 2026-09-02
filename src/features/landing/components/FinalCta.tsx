import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';

export function FinalCta({ apkUrl }: { apkUrl: string }) {
  const navigate = useNavigate();

  return (
    <section className="lp-section">
      <div className="lp-container">
        <Reveal>
          <div className="lp-final-cta">
            <h2>Empieza a recibir tus medicamentos <span style={{ color: 'var(--lp-teal)' }}>sin complicaciones.</span></h2>
            <p>Descargá la app o entrá al panel si sos parte del equipo de MediRuta.</p>
            <div className="lp-final-cta-buttons">
              <a href={apkUrl} className="lp-btn lp-btn-primary">
                <svg className="lp-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar la app
              </a>
              <button type="button" className="lp-btn lp-btn-secondary" style={{ color: 'var(--lp-navy)', borderColor: 'rgba(var(--lp-navy-rgb), 0.1)' }} onClick={() => navigate('/login')}>
                Panel administrador
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}