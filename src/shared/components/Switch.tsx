import type { InputHTMLAttributes } from 'react';
import './Switch.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

/** Switch tipo iOS para toggles binarios (ej. modo oscuro en `PerfilTab`). */
export function Switch({ label, id, ...resto }: Props) {
  return (
    <label className="ui-switch" htmlFor={id}>
      <input type="checkbox" role="switch" id={id} className="ui-switch-input" {...resto} />
      <span className="ui-switch-track" aria-hidden>
        <span className="ui-switch-thumb" />
      </span>
      <span className="ui-switch-label">{label}</span>
    </label>
  );
}
