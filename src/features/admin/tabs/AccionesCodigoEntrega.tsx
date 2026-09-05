type Props = {
  codigoEntrega: string | null;
  regenerando: boolean;
  reenviando: boolean;
  onRegenerar: () => void;
  onReenviar: () => void;
};

/**
 * HU-07 (ronda 3) — acciones del admin cuando el paciente reporta no
 * ver su código de entrega (NovedadesTab): regenerarlo o reenviarlo por
 * correo. Puramente presentacional — las llamadas a la API y el manejo
 * de estado/errores viven en `NovedadesTab`, mismo criterio que ya
 * usaba `onResolver` ahí.
 */
export function AccionesCodigoEntrega({
  codigoEntrega,
  regenerando,
  reenviando,
  onRegenerar,
  onReenviar,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {codigoEntrega ? (
        <div className="admin-diff-campo">
          <strong>Código vigente</strong>
          {codigoEntrega}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="lp-novedades-btn lp-novedades-btn-secondary"
          onClick={onRegenerar}
          disabled={regenerando || reenviando}
        >
          {regenerando ? 'Regenerando…' : 'Regenerar código'}
        </button>
        <button
          type="button"
          className="lp-novedades-btn lp-novedades-btn-secondary"
          onClick={onReenviar}
          disabled={regenerando || reenviando}
        >
          {reenviando ? 'Enviando…' : 'Reenviar por correo'}
        </button>
      </div>
    </div>
  );
}
