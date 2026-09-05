import type { DatosEdicionPedido, Medicamento } from '../api/pedidosAdminApi';

type Props = {
  actuales: DatosEdicionPedido | null;
  propuestos: DatosEdicionPedido | null;
};

const ETIQUETAS_DIRECCION: Record<'direccionEntrega' | 'direccionFarmacia', string> = {
  direccionEntrega: 'Dirección de entrega',
  direccionFarmacia: 'Dirección de farmacia',
};

function resumenMedicamento(m: Medicamento): string {
  return [m.nombre ?? 'Sin nombre', m.concentracion, m.formaFarmaceutica, m.cantidad]
    .filter(Boolean)
    .join(' · ');
}

/**
 * HU-07 (ronda 3/4) — diff "antes / propuesto" que ve el admin antes de
 * aprobar o rechazar una solicitud de edición (`NovedadDetalle`). Cada
 * bloque (direcciones, medicamentos) solo aparece si el paciente
 * realmente pidió cambiar ese dato — un campo/lista ausente en
 * `propuestos` significa "no pidió tocar esto". La foto de receta no
 * se pinta acá — `NovedadDetalle` la muestra aparte con
 * `recetaActualUrl`/`recetaPropuestaUrl` (URLs firmadas, no viajan en
 * `datosPropuestos`).
 */
export function DiffEdicionPedido({ actuales, propuestos }: Props) {
  const camposDireccion = (
    Object.keys(ETIQUETAS_DIRECCION) as (keyof typeof ETIQUETAS_DIRECCION)[]
  ).filter((campo) => propuestos?.[campo]);

  const medicamentosPropuestos = propuestos?.medicamentos;

  if (camposDireccion.length === 0 && !medicamentosPropuestos) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {camposDireccion.length > 0 ? (
        <div className="admin-diff-edicion">
          <div className="admin-diff-columna">
            <div className="admin-diff-columna-titulo">Direcciones — actual</div>
            {camposDireccion.map((campo) => (
              <div className="admin-diff-campo" key={campo}>
                <strong>{ETIQUETAS_DIRECCION[campo]}</strong>
                {actuales?.[campo] ?? '—'}
              </div>
            ))}
          </div>
          <div className="admin-diff-columna admin-diff-columna--propuesto">
            <div className="admin-diff-columna-titulo">Direcciones — propuesto</div>
            {camposDireccion.map((campo) => (
              <div className="admin-diff-campo" key={campo}>
                <strong>{ETIQUETAS_DIRECCION[campo]}</strong>
                {propuestos?.[campo]}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {medicamentosPropuestos ? (
        <div className="admin-diff-edicion">
          <div className="admin-diff-columna">
            <div className="admin-diff-columna-titulo">Medicamentos — actual</div>
            {(actuales?.medicamentos ?? []).length === 0 ? (
              <div className="admin-diff-campo">Ninguno cargado</div>
            ) : (
              actuales!.medicamentos!.map((m, i) => (
                <div className="admin-diff-campo" key={i}>
                  {resumenMedicamento(m)}
                </div>
              ))
            )}
          </div>
          <div className="admin-diff-columna admin-diff-columna--propuesto">
            <div className="admin-diff-columna-titulo">Medicamentos — propuesto</div>
            {medicamentosPropuestos.length === 0 ? (
              <div className="admin-diff-campo">Ninguno cargado</div>
            ) : (
              medicamentosPropuestos.map((m, i) => (
                <div className="admin-diff-campo" key={i}>
                  {resumenMedicamento(m)}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
