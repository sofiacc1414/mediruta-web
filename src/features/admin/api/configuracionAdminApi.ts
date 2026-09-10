import { apiClient } from '../../../shared/lib/apiClient';

export type ParametrosPrecioDomicilio = {
  tarifaBaseDomicilio: number;
  tarifaPorKm: number;
  tarifaPorMinuto: number;
  tiempoBaseFarmaciaMin: number;
  velocidadPromedioKmh: number;
  distanciaIncluidaKm: number;
  tarifaPorKmExcedente: number;
};

export type ConfiguracionAdmin = ParametrosPrecioDomicilio & {
  umbralDemoraAsignacionMinutos: number;
};

export type NivelCopago = {
  id: string;
  nombre: string;
  copago: number;
  orden: number;
};

type MensajeResultado = { message: string };

/** Umbral (minutos) que dispara la alarma de "pedido demorado sin
 * domiciliario" en la pestaña Pedidos, y los parámetros del costo de
 * domicilio (recorrido + tiempo) — todo configurable por el admin. */
export function obtenerConfiguracionAdmin(accessToken: string) {
  return apiClient.get('/admin/configuracion', { accessToken }) as Promise<ConfiguracionAdmin>;
}

export function actualizarConfiguracionAdmin(
  accessToken: string,
  configuracion: ConfiguracionAdmin,
) {
  return apiClient.patch('/admin/configuracion', configuracion, { accessToken }) as Promise<MensajeResultado>;
}

/** Catálogo propio de MediRuta (no el copago real de EPS, que depende
 * de tarifas privadas EPS-IPS que no tenemos forma de conocer) — un
 * valor fijo en COP por nivel, que el Paciente autodeclara en su
 * perfil. */
export function listarNivelesCopago(accessToken: string) {
  return apiClient.get('/admin/configuracion/niveles-copago', {
    accessToken,
  }) as Promise<NivelCopago[]>;
}

export function crearNivelCopago(
  accessToken: string,
  nivel: { nombre: string; copago: number; orden: number },
) {
  return apiClient.post('/admin/configuracion/niveles-copago', nivel, {
    accessToken,
  }) as Promise<{ id: string }>;
}

export function actualizarNivelCopago(
  accessToken: string,
  id: string,
  nivel: { nombre: string; copago: number; orden: number },
) {
  return apiClient.put(`/admin/configuracion/niveles-copago/${id}`, nivel, {
    accessToken,
  }) as Promise<{ id: string }>;
}

export function eliminarNivelCopago(accessToken: string, id: string) {
  return apiClient.delete(`/admin/configuracion/niveles-copago/${id}`, {
    accessToken,
  }) as Promise<MensajeResultado>;
}
