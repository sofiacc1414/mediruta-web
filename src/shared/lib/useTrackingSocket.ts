import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiClient } from './apiClient';

export type PosicionEnVivo = {
  resultado?: string;
  estado: string;
  domiciliarioLat: number | null;
  domiciliarioLng: number | null;
  ubicacionActualizadaEn: string | null;
  farmaciaLat: number | null;
  farmaciaLng: number | null;
  entregaLat: number | null;
  entregaLng: number | null;
};

export type PosicionActualizada = { lat: number; lng: number; actualizadoEn: string };

/**
 * Seguimiento GPS en vivo — vista espejo pasiva del Admin (mismo
 * `TrackingGateway`/`/ws-tracking` que usa la App). Solo lectura: el
 * Admin nunca manda su propia posición, solo se suscribe a la de un
 * pedido puntual.
 *
 * `forceNew: true` es obligatorio acá — a diferencia de
 * `useEventosSocket` (única conexión WS de esta app hasta ahora), esta
 * es una SEGUNDA conexión al mismo `apiClient.baseUrl`; sin forzar una
 * nueva, `socket.io-client` puede terminar reusando/compartiendo la
 * conexión de `/ws` (mismo bug real que se encontró y corrigió del
 * lado de la App con el chat).
 */
export function useTrackingSocket(
  accessToken: string | null,
  solicitudId: string | null,
  onPosicionInicial: (posicion: PosicionEnVivo) => void,
  onPosicionNueva: (posicion: PosicionActualizada) => void,
  onError: (motivo: string) => void,
) {
  const posicionInicialRef = useRef(onPosicionInicial);
  const posicionNuevaRef = useRef(onPosicionNueva);
  const errorRef = useRef(onError);
  useEffect(() => {
    posicionInicialRef.current = onPosicionInicial;
    posicionNuevaRef.current = onPosicionNueva;
    errorRef.current = onError;
  }, [onPosicionInicial, onPosicionNueva, onError]);

  useEffect(() => {
    if (!accessToken || !solicitudId) return;

    const socket: Socket = io(apiClient.baseUrl, {
      path: '/ws-tracking',
      auth: { token: accessToken },
      forceNew: true,
    });

    socket.on('connect', () => socket.emit('tracking:suscribir', { solicitudId }));
    socket.on('tracking:posicion_inicial', (data: PosicionEnVivo) => posicionInicialRef.current(data));
    socket.on('tracking:posicion', (data: PosicionActualizada) => posicionNuevaRef.current(data));
    socket.on('tracking:error', (data: { motivo?: string }) => errorRef.current(data.motivo ?? 'error'));

    return () => {
      socket.disconnect();
    };
  }, [accessToken, solicitudId]);
}
