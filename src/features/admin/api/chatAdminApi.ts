import { apiClient } from '../../../shared/lib/apiClient';

export type RolRemitenteChat = 'PACIENTE' | 'DOMICILIARIO';

export type MensajeChatAdmin = {
  id: string;
  chatId: string;
  remitenteId: string;
  rolRemitente: RolRemitenteChat;
  contenido: string;
  creadoEn: string;
  leidoEn: string | null;
};

/** Auditoría del Admin — solo lectura (decisión tomada: el Admin no
 * escribe en el chat en esta versión). Devuelve `[]` también cuando el
 * pedido todavía no tiene chat (nunca se abrió desde la App). */
export function listarMensajesChatAdmin(accessToken: string, solicitudId: string) {
  return apiClient.get(`/admin/chat/pedido/${solicitudId}`, {
    accessToken,
  }) as Promise<MensajeChatAdmin[]>;
}
