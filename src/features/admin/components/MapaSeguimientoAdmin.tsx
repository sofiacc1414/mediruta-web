import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { useTrackingSocket, type PosicionActualizada, type PosicionEnVivo } from '../../../shared/lib/useTrackingSocket';
import './MapaSeguimientoAdmin.css';

const ICONO_DOMICILIARIO = L.divIcon({
  className: 'lp-mapa-icono-domiciliario',
  html: '🛵',
  iconSize: [32, 32],
});
const ICONO_FARMACIA = L.divIcon({ className: 'lp-mapa-icono-punto', html: '🏬', iconSize: [26, 26] });
const ICONO_ENTREGA = L.divIcon({ className: 'lp-mapa-icono-punto', html: '🏠', iconSize: [26, 26] });

/** Vista espejo pasiva del Admin sobre el seguimiento GPS en vivo —
 * mismo `TrackingGateway` que usa la App, solo lectura (el Admin nunca
 * manda su propia posición). Solo tiene sentido mientras el pedido
 * está `en_camino_entrega` (ver el gate en `PedidosTab.tsx`). Leaflet
 * imperativo (sin `react-leaflet`) para no sumar una dependencia de
 * manejo de estado que el resto del panel no usa. */
export function MapaSeguimientoAdmin({ solicitudId }: { solicitudId: string }) {
  const { estado } = useAuth();
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadorDomiciliarioRef = useRef<L.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const inicializarMapa = useCallback((centro: [number, number]) => {
    if (mapaRef.current || !contenedorRef.current) return;
    const mapa = L.map(contenedorRef.current).setView(centro, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);
    mapaRef.current = mapa;
  }, []);

  const onPosicionInicial = useCallback(
    (posicion: PosicionEnVivo) => {
      setCargando(false);
      if (posicion.resultado && posicion.resultado !== 'ok') {
        setError(_mensajeError(posicion.resultado));
        return;
      }
      const centro: [number, number] =
        posicion.domiciliarioLat != null && posicion.domiciliarioLng != null
          ? [posicion.domiciliarioLat, posicion.domiciliarioLng]
          : posicion.farmaciaLat != null && posicion.farmaciaLng != null
            ? [posicion.farmaciaLat, posicion.farmaciaLng]
            : [6.2442, -75.5812];
      inicializarMapa(centro);
      const mapa = mapaRef.current;
      if (!mapa) return;

      if (posicion.farmaciaLat != null && posicion.farmaciaLng != null) {
        L.marker([posicion.farmaciaLat, posicion.farmaciaLng], { icon: ICONO_FARMACIA }).addTo(mapa);
      }
      if (posicion.entregaLat != null && posicion.entregaLng != null) {
        L.marker([posicion.entregaLat, posicion.entregaLng], { icon: ICONO_ENTREGA }).addTo(mapa);
      }
      if (posicion.domiciliarioLat != null && posicion.domiciliarioLng != null) {
        marcadorDomiciliarioRef.current = L.marker(
          [posicion.domiciliarioLat, posicion.domiciliarioLng],
          { icon: ICONO_DOMICILIARIO },
        ).addTo(mapa);
      }
    },
    [inicializarMapa],
  );

  const onPosicionNueva = useCallback((posicion: PosicionActualizada) => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const nuevaPos: [number, number] = [posicion.lat, posicion.lng];
    if (marcadorDomiciliarioRef.current) {
      marcadorDomiciliarioRef.current.setLatLng(nuevaPos);
    } else {
      marcadorDomiciliarioRef.current = L.marker(nuevaPos, { icon: ICONO_DOMICILIARIO }).addTo(mapa);
    }
  }, []);

  const onError = useCallback((motivo: string) => {
    setCargando(false);
    setError(_mensajeError(motivo));
  }, []);

  useTrackingSocket(
    estado.tipo === 'autenticado' ? estado.accessToken : null,
    solicitudId,
    onPosicionInicial,
    onPosicionNueva,
    onError,
  );

  useEffect(() => {
    return () => {
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, []);

  return (
    <div className="lp-pedidos-detalle-card lp-mapa-seguimiento">
      <h3 className="lp-pedidos-detalle-card-titulo">🗺️ Seguimiento en vivo</h3>
      {error && <p className="lp-pedidos-detalle-card-sin">{error}</p>}
      {cargando && !error && <p className="lp-pedidos-detalle-card-sin">Cargando mapa…</p>}
      <div ref={contenedorRef} className="lp-mapa-seguimiento-mapa" style={{ display: error ? 'none' : 'block' }} />
    </div>
  );
}

function _mensajeError(motivo: string): string {
  if (motivo === 'sin_tracking_disponible' || motivo === 'TrackingNoDisponibleError') {
    return 'El seguimiento en vivo no está disponible para este pedido en este momento.';
  }
  if (motivo === 'no_autorizado' || motivo === 'NoAutorizadoError') {
    return 'No autorizado para ver el seguimiento de este pedido.';
  }
  return 'No se pudo cargar el seguimiento en vivo.';
}
