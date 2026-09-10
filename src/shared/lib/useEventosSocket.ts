import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiClient } from './apiClient';

/**
 * Aviso instantáneo de "algo cambió en algún pedido" vía WebSocket (ver
 * `EventosGateway`/`EventosTiempoRealPort` en la API) — se usa junto al
 * poll de 15s que ya tienen las pantallas del panel (ej. `PedidosTab`),
 * nunca en su reemplazo: si el socket se cae (red, deploy de la API,
 * etc.) el poll sigue refrescando solo, esto es pura ganancia de
 * latencia.
 *
 * El evento (`pedido:actualizado`) no trae datos — cada pantalla que se
 * suscribe con este hook ya sabe qué volver a pedir para sí misma
 * (mismo criterio que la API: evitar duplicar acá autorización/
 * serialización). `accessToken` es el mismo que ya usa `apiClient` para
 * los requests REST — mientras sea `null` (sin sesión autenticada
 * todavía) no se conecta nada.
 */
export function useEventosSocket(accessToken: string | null, onPedidoActualizado: () => void) {
  const callbackRef = useRef(onPedidoActualizado);
  useEffect(() => {
    callbackRef.current = onPedidoActualizado;
  }, [onPedidoActualizado]);

  useEffect(() => {
    if (!accessToken) return;

    const socket: Socket = io(apiClient.baseUrl, {
      path: '/ws',
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socket.on('pedido:actualizado', () => callbackRef.current());

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);
}
