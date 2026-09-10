import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiClient } from './apiClient';

/**
 * Aviso instantáneo de "algo cambió en algún pedido" vía WebSocket (ver
 * `EventosGateway`/`EventosTiempoRealPort` en la API) — reemplaza el
 * poll fijo que tenían las pantallas del panel (ej. `PedidosTab`): ya no
 * hace falta, porque esto también cubre el caso que cubría el poll
 * (perderse un cambio por una desconexión pasajera) refrescando también
 * al reconectar, no solo ante el evento.
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

    // `connect` dispara tanto en la primera conexión como en cada
    // reconexión automática de socket.io-client — en ambos casos vale
    // la pena refrescar, por si se perdió algún evento mientras estuvo
    // desconectado.
    socket.on('connect', () => callbackRef.current());
    socket.on('pedido:actualizado', () => callbackRef.current());

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);
}
