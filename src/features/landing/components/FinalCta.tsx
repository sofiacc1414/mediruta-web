import { useNavigate } from 'react-router-dom';
import { Reveal } from './Reveal';

export function FinalCta({ apkUrl }: { apkUrl: string }) {
  const navigate = useNavigate();

  return (
    <section className="lp-section">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-final-cta">
            <h2>Empieza a recibir tus medicamentos sin complicaciones.</h2>
            <p>Descargá la app o entrá al panel si sos parte del equipo de MediRuta.</p>
            <div className="lp-final-cta-ctas">
              <a href={apkUrl} className="lp-btn lp-btn-primary">
                Descargar la app
              </a>
              <button type="button" className="lp-btn lp-btn-secondary" onClick={() => navigate('/login')}>
                Soy administrador
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
