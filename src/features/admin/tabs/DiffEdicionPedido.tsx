import type { DatosEdicionPedido } from '../api/pedidosAdminApi';

type Props = {
  actuales: DatosEdicionPedido | null;
  propuestos: DatosEdicionPedido | null;
};

const ETIQUETAS: Record<keyof DatosEdicionPedido, string> = {
  direccionEntrega: 'Dirección de entrega',
  direccionFarmacia: 'Dirección de farmacia',
};

/**
 * HU-07 (ronda 3) — diff "antes / propuesto" que ve el admin antes de
 * aprobar o rechazar una solicitud de edición (NovedadesTab). Solo
 * pinta los campos que el paciente realmente pidió cambiar — un campo
 * `null` en `propuestos` significa "no pidió tocar este dato".
 */
export function DiffEdicionPedido({ actuales, propuestos }: Props) {
  const campos = (Object.keys(ETIQUETAS) as (keyof DatosEdicionPedido)[]).filter(
    (campo) => propuestos?.[campo],
  );

  if (campos.length === 0) return null;

  return (
    <div className="admin-diff-edicion">
      <div className="admin-diff-columna">
        <div className="admin-diff-columna-titulo">Actual</div>
        {campos.map((campo) => (
          <div className="admin-diff-campo" key={campo}>
            <strong>{ETIQUETAS[campo]}</strong>
            {actuales?.[campo] ?? '—'}
          </div>
        ))}
      </div>
      <div className="admin-diff-columna admin-diff-columna--propuesto">
        <div className="admin-diff-columna-titulo">Propuesto</div>
        {campos.map((campo) => (
          <div className="admin-diff-campo" key={campo}>
            <strong>{ETIQUETAS[campo]}</strong>
            {propuestos?.[campo]}
          </div>
        ))}
      </div>
    </div>
  );
}
