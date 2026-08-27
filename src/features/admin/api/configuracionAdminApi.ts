import { apiClient } from '../../../shared/lib/apiClient';

export type ConfiguracionAdmin = {
  umbralDemoraAsignacionMinutos: number;
};

type MensajeResultado = { message: string };

/** Umbral (minutos) que dispara la alarma de "pedido demorado sin
 * domiciliario" en la pestaña Pedidos — configurable por el admin. */
export function obtenerConfiguracionAdmin(accessToken: string) {
  return apiClient.get('/admin/configuracion', { accessToken }) as Promise<ConfiguracionAdmin>;
}

export function actualizarConfiguracionAdmin(accessToken: string, umbralMinutos: number) {
  return apiClient.patch(
    '/admin/configuracion',
    { umbralMinutos },
    { accessToken },
  ) as Promise<MensajeResultado>;
}
