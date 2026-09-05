import { Reveal } from './Reveal';

const STEPS = [
  {
    num: '01',
    icon: '/images/paso1.jpg',
    titulo: 'Sube tu receta',
    texto: 'El paciente carga su receta de forma sencilla y segura desde la app.',
  },
  {
    num: '02',
    icon: '/images/paso2.jpg',
    titulo: 'Selecciona tu farmacia',
    texto: 'Indica dónde debe recogerse el medicamento en tu zona.',
  },
  {
    num: '03',
    icon: '/images/paso3.jpg',
    titulo: 'Recibe tu pedido',
    texto: 'Un domiciliario recoge el medicamento y lo lleva hasta tu hogar.',
  },
  {
    num: '04',
    icon: '/images/paso4.jpg',
    titulo: 'Sigue la entrega',
    texto: 'Consulta el estado del pedido y la ubicación en tiempo real.',
  },
];

export function HowItWorks() {
  return (
    <section className="lp-section lp-section-alt" id="como-funciona">
      <div className="lp-container">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-section-eyebrow center">Cómo funciona</span>
            <h2 className="lp-section-title">De la receta a tu puerta</h2>
            <p className="lp-section-desc">
              Cuatro pasos simples para recibir tus medicamentos sin complicaciones
            </p>
          </div>
        </Reveal>

        <div className="lp-steps-grid">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delayMs={i * 100}>
              <div className="lp-step-card">
                <div className="lp-step-number">{step.num}</div>
                <img 
                  src={step.icon} 
                  alt={step.titulo}
                  className="lp-step-image"
                  loading="lazy"
                />
                <h3>{step.titulo}</h3>
                <p>{step.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}