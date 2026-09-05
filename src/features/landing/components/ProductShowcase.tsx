import { DeliveredScreen, TrackingScreen, UploadScreen } from './PhoneMockup';
import { Reveal, RevealScale } from './Reveal';

const SCREENS = [
  { 
    titulo: 'Cargar receta', 
    texto: 'Subís la foto y elegís farmacia y dirección en menos de un minuto.', 
    screen: <UploadScreen />,
    icon: '📄'
  },
  { 
    titulo: 'Pedido en curso', 
    texto: 'Ves en tiempo real dónde está tu domiciliario.', 
    screen: <TrackingScreen compact />,
    icon: '🔄'
  },
  { 
    titulo: 'Entrega confirmada', 
    texto: 'Un código único certifica que el pedido llegó a la persona correcta.', 
    screen: <DeliveredScreen />,
    icon: '✅'
  },
];

export function ProductShowcase() {
  return (
    <section className="lp-section lp-section-alt">
      <div className="lp-container">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-section-eyebrow center">La plataforma</span>
            <h2 className="lp-section-title">Detrás del domiciliario, una app real</h2>
            <p className="lp-section-desc">
              Tres pantallas clave que muestran cómo funciona la experiencia completa
            </p>
          </div>
        </Reveal>

        <div className="lp-showcase-grid">
          {SCREENS.map((item, i) => (
            <RevealScale key={item.titulo} delayMs={i * 120}>
              <div className="lp-showcase-item">
                <div className="lp-phone-mockup">
                  <div className="lp-phone-screen">
                    <div className="lp-phone-notch" />
                    <div className="lp-phone-content">
                      {item.screen}
                    </div>
                  </div>
                </div>
                <h3>{item.icon} {item.titulo}</h3>
                <p>{item.texto}</p>
              </div>
            </RevealScale>
          ))}
        </div>
      </div>
    </section>
  );
}