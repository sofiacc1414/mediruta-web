import { CheckCircleIcon, DocumentIcon, PinIcon, ShieldIcon } from '../../../shared/components/icons';
import { Reveal } from './Reveal';

const CARDS = [
  { icon: <PinIcon />, titulo: 'Seguimiento', texto: 'Cada estado del pedido, visible al instante.' },
  { icon: <ShieldIcon />, titulo: 'Seguridad', texto: 'Domiciliarios validados antes de operar.' },
  { icon: <DocumentIcon />, titulo: 'Trazabilidad', texto: 'Historial completo, de la receta a la entrega.' },
  { icon: <CheckCircleIcon />, titulo: 'Confirmación', texto: 'Código único que valida quién recibe el pedido.' },
];

export function TrustSection() {
  return (
    <section className="lp-section lp-section-navy">
      <div className="lp-shell lp-trust-section">
        <Reveal>
          <div>
            <h2 className="lp-trust-title">Tu medicamento merece un proceso seguro.</h2>
            <p className="lp-trust-sub">
              Cada pedido queda registrado paso a paso — desde que se sube la receta hasta que se
              confirma la entrega en la puerta de tu casa.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="lp-trust-cards">
            {CARDS.map((c) => (
              <div key={c.titulo} className="lp-trust-card">
                {c.icon}
                <h4>{c.titulo}</h4>
                <p>{c.texto}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
