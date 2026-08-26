import { DocumentIcon, MopedIcon, PinIcon, StoreIcon } from '../../../shared/components/icons';
import { Reveal } from './Reveal';

const STEPS = [
  {
    num: '01',
    icon: <DocumentIcon />,
    titulo: 'Sube tu receta',
    texto: 'El paciente carga su receta de forma sencilla y segura.',
  },
  {
    num: '02',
    icon: <StoreIcon />,
    titulo: 'Selecciona tu farmacia',
    texto: 'Indica dónde debe recogerse el medicamento.',
  },
  {
    num: '03',
    icon: <MopedIcon />,
    titulo: 'Recibe tu pedido',
    texto: 'Un domiciliario recoge el medicamento y lo lleva hasta tu hogar.',
  },
  {
    num: '04',
    icon: <PinIcon />,
    titulo: 'Sigue la entrega',
    texto: 'Consulta el estado del pedido y la ubicación de la entrega.',
  },
];

export function HowItWorks() {
  return (
    <section className="lp-section lp-section-white" id="como-funciona">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-eyebrow" style={{ justifyContent: 'center' }}>
              Cómo funciona
            </span>
            <h2 className="lp-section-title">De la receta a tu puerta</h2>
          </div>
        </Reveal>

        <div className="lp-steps">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delayMs={i * 90}>
              <div className="lp-step">
                <span className="lp-step-num">{step.num}</span>
                <div className="lp-step-heading">
                  <span className="lp-step-icon-badge">{step.icon}</span>
                  <h3>{step.titulo}</h3>
                </div>
                <p>{step.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
