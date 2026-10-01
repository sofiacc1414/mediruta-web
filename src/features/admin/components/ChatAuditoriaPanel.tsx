import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { listarMensajesChatAdmin, type MensajeChatAdmin } from '../api/chatAdminApi';
import './ChatAuditoriaPanel.css';

function formatearHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Auditoría del Admin sobre el chat Paciente↔Domiciliario de un
 * pedido — solo lectura (decisión tomada: el Admin no escribe acá).
 * Refresco manual con un botón, no WebSocket: para auditoría pasiva
 * no vale la pena duplicar la lógica de socket del panel Web solo
 * para esto (si más adelante se quiere tiempo real, es una extensión
 * simple sobre el mismo ChatGateway). */
export function ChatAuditoriaPanel({ solicitudId }: { solicitudId: string }) {
  const { estado } = useAuth();
  const [mensajes, setMensajes] = useState<MensajeChatAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setCargando(true);
    setError(null);
    listarMensajesChatAdmin(estado.accessToken, solicitudId)
      .then(setMensajes)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      })
      .finally(() => setCargando(false));
  }, [estado, solicitudId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado.tipo !== 'autenticado') return null;

  return (
    <div className="lp-pedidos-detalle-card lp-chat-auditoria">
      <div className="lp-chat-auditoria-header">
        <h3 className="lp-pedidos-detalle-card-titulo">💬 Chat del pedido (auditoría)</h3>
        <button
          type="button"
          className="lp-pedidos-btn lp-pedidos-btn-secondary lp-chat-auditoria-refrescar"
          onClick={cargar}
          disabled={cargando}
        >
          {cargando ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      {error && <Alert tono="error">{error}</Alert>}

      {!error && mensajes !== null && mensajes.length === 0 && (
        <p className="lp-pedidos-detalle-card-sin">Todavía no hay mensajes en este chat.</p>
      )}

      {!error && mensajes && mensajes.length > 0 && (
        <div className="lp-chat-auditoria-lista">
          {mensajes.map((mensaje) => (
            <div
              key={mensaje.id}
              className={`lp-chat-burbuja lp-chat-burbuja--${mensaje.rolRemitente.toLowerCase()}`}
            >
              <span className="lp-chat-burbuja-rol">
                {mensaje.rolRemitente === 'PACIENTE' ? 'Paciente' : 'Domiciliario'}
              </span>
              <p className="lp-chat-burbuja-contenido">{mensaje.contenido}</p>
              <span className="lp-chat-burbuja-hora">
                {formatearHora(mensaje.creadoEn)}
                {mensaje.leidoEn ? ' · leído' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
