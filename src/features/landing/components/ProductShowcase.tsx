import { DeliveredScreen, PhoneMockup, TrackingScreen, UploadScreen } from './PhoneMockup';
import { Reveal } from './Reveal';

const SCREENS = [
  { titulo: 'Cargar receta', texto: 'Subís la foto y elegís farmacia y dirección en menos de un minuto.', screen: <UploadScreen /> },
  { titulo: 'Pedido en curso', texto: 'Ves en tiempo real dónde está tu domiciliario.', screen: <TrackingScreen compact /> },
  { titulo: 'Entrega confirmada', texto: 'Un código único certifica que el pedido llegó a la persona correcta.', screen: <DeliveredScreen /> },
];

export function ProductShowcase() {
  return (
    <section className="lp-section lp-section-white">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-eyebrow" style={{ justifyContent: 'center' }}>
              La plataforma
            </span>
            <h2 className="lp-section-title">Detrás del domiciliario, una app real</h2>
          </div>
        </Reveal>

        <div className="lp-showcase-row">
          {SCREENS.map((item, i) => (
            <Reveal key={item.titulo} delayMs={i * 120}>
              <div className="lp-showcase-item">
                <PhoneMockup>{item.screen}</PhoneMockup>
                <h3>{item.titulo}</h3>
                <p>{item.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
