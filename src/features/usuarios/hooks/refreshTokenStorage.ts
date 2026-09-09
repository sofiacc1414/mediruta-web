/**
 * Persistencia del refresh token en localStorage — mismo criterio que
 * `ApiClient` de la App Flutter (que lo guarda en `flutter_secure_storage`):
 * la API ya soporta este flujo para cualquier cliente que no mande
 * `X-Client-Type: web` (ver `auth.controller.ts` — el refresh token viaja
 * en el body en vez de por cookie HttpOnly).
 *
 * Se abandonó el flujo de cookie HttpOnly cross-site porque Web
 * (Vercel) y la API (Render) son dominios distintos sin un dominio
 * propio en común — Chrome/Safari tratan esa cookie como "de tercero" y
 * la bloquean cada vez más agresivamente por defecto, lo que rompía la
 * persistencia de sesión. Decisión explícita del equipo: aceptar el
 * riesgo de XSS de tener el refresh token en localStorage a cambio de
 * que la sesión sí persista sin depender de un dominio propio.
 */
const REFRESH_TOKEN_KEY = 'mediruta_refresh_token';

export function guardarRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // Navegación privada u otro bloqueo de storage: la sesión
    // simplemente no persistirá entre recargas, sin romper el login.
  }
}

export function leerRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function limpiarRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nada que limpiar si ni siquiera se pudo leer/escribir.
  }
}
