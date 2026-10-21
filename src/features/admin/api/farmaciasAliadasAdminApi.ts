import { apiClient } from '../../../shared/lib/apiClient';

export type FarmaciaAliada = {
  id: string;
  eps: string;
  nombreFarmacia: string;
  ciudad: string;
  departamento: string | null;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
};

export type FarmaciaAliadaInput = {
  eps: string;
  nombreFarmacia: string;
  ciudad: string;
  departamento?: string;
  direccion?: string;
  telefono?: string;
  activo: boolean;
};

type MensajeResultado = { message: string };

/** Módulo 2 (Chatbot) — catálogo de farmacias aliadas por EPS que el
 * bot usa para responder "¿cuáles son las farmacias de mi EPS?". A
 * diferencia del copago (regulado por el Gobierno), esta información
 * cambia seguido en la vida real — por eso es editable acá, no fija en
 * código. */
export function listarFarmaciasAliadas(accessToken: string) {
  return apiClient.get('/admin/farmacias-aliadas', { accessToken }) as Promise<FarmaciaAliada[]>;
}

export function crearFarmaciaAliada(accessToken: string, farmacia: FarmaciaAliadaInput) {
  return apiClient.post('/admin/farmacias-aliadas', farmacia, {
    accessToken,
  }) as Promise<{ id: string }>;
}

export function actualizarFarmaciaAliada(
  accessToken: string,
  id: string,
  farmacia: FarmaciaAliadaInput,
) {
  return apiClient.put(`/admin/farmacias-aliadas/${id}`, farmacia, {
    accessToken,
  }) as Promise<{ id: string }>;
}

export function eliminarFarmaciaAliada(accessToken: string, id: string) {
  return apiClient.delete(`/admin/farmacias-aliadas/${id}`, {
    accessToken,
  }) as Promise<MensajeResultado>;
}
