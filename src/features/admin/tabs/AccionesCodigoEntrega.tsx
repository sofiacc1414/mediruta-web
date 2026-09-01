import { Button } from '../../../shared/components/Button';

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
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button
          variante="secondary"
          style={{ width: 'auto', flexShrink: 0 }}
          onClick={onRegenerar}
          disabled={regenerando || reenviando}
        >
          {regenerando ? 'Regenerando…' : 'Regenerar código'}
        </Button>
        <Button
          variante="secondary"
          style={{ width: 'auto', flexShrink: 0 }}
          onClick={onReenviar}
          disabled={regenerando || reenviando}
        >
          {reenviando ? 'Enviando…' : 'Reenviar por correo'}
        </Button>
      </div>
    </div>
  );
}
