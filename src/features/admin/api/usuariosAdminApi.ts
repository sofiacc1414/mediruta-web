import { apiClient } from '../../../shared/lib/apiClient';

export type CrearAdministradorInput = {
  correo: string;
  password: string;
  nombreCompleto?: string;
  telefono?: string;
};

type CrearAdministradorResultado = {
  usuarioId: string;
  correo: string;
};

/** Solo ROOT — crea una cuenta ADMINISTRADOR directa (habilitada de una). */
export function crearAdministrador(accessToken: string, input: CrearAdministradorInput) {
  return apiClient.post('/admin/usuarios', input, {
    accessToken,
  }) as Promise<CrearAdministradorResultado>;
}
