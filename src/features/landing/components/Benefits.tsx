import {
  ClockIcon,
  EyeIcon,
  HomeIcon,
  MapIcon,
  PinIcon,
  ShieldIcon,
} from '../../../shared/components/icons';
import { Reveal } from './Reveal';

const BENEFITS = [
  { icon: <ShieldIcon />, titulo: 'Seguridad', texto: 'Entregas verificadas con un código único para cada pedido.' },
  { icon: <PinIcon />, titulo: 'Seguimiento', texto: 'Mirá en qué paso está tu pedido en cualquier momento.' },
  { icon: <ClockIcon />, titulo: 'Rapidez', texto: 'Asignación automática al domiciliario más cercano.' },
  { icon: <HomeIcon />, titulo: 'Comodidad', texto: 'Pedí desde donde estés, sin salir de tu casa.' },
  { icon: <EyeIcon />, titulo: 'Transparencia', texto: 'Historial completo de cada estado del pedido.' },
  { icon: <MapIcon />, titulo: 'Cobertura', texto: 'La red de domiciliarios crece con la demanda de tu zona.' },
];

export function Benefits() {
  return (
    <section className="lp-section" id="beneficios">
      <div className="lp-shell">
        <Reveal>
          <div className="lp-section-head center">
            <span className="lp-eyebrow" style={{ justifyContent: 'center' }}>
              Beneficios
            </span>
            <h2 className="lp-section-title">Pensado para que confíes en el proceso</h2>
          </div>
        </Reveal>

        <Reveal>
          <div className="lp-benefits-grid">
            {BENEFITS.map((b) => (
              <div key={b.titulo} className="lp-benefit">
                <span className="lp-benefit-icon">{b.icon}</span>
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
