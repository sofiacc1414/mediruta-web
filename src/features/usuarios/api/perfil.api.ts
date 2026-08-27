import { apiClient } from '../../../shared/lib/apiClient';

export type Perfil = {
  nombreCompleto: string | null;
  telefono: string | null;
  fotoPerfilUrl: string | null;
  paciente: unknown | null;
  domiciliario: unknown | null;
};

/** GET /perfil no exige ningún rol (`PerfilController` solo pide sesión
 * activa) — cualquier cuenta autenticada tiene datos comunes propios,
 * ROOT/ADMINISTRADOR incluidos. */
export function obtenerPerfil(accessToken: string) {
  return apiClient.get('/perfil', { accessToken }) as Promise<Perfil>;
}

/** G03/G04 — nombre + teléfono van juntos en un solo PATCH (la API no
 * acepta actualización parcial de estos 2 campos). */
export function actualizarDatosComunes(
  accessToken: string,
  nombreCompleto: string,
  telefono: string,
) {
  return apiClient.patch(
    '/perfil',
    { nombreCompleto, telefono },
    { accessToken },
  ) as Promise<{ message: string }>;
}

/** Foto de perfil (avatar), común a cualquier rol — ROOT/ADMINISTRADOR
 * incluidos. */
export function subirFotoPerfil(accessToken: string, archivo: File) {
  return apiClient.postMultipart('/perfil/foto', archivo, { accessToken }) as Promise<{
    message: string;
    url: string;
  }>;
}
