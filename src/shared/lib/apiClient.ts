import { ApiError, ApiSinConexionError } from './apiError';

/**
 * Cliente base para hablar con mediruta-api. La URL sale de VITE_API_URL
 * (ver .env.example) — nunca se llama a Supabase directamente desde aquí
 * (DOCS/context.md, Parte B, sección 4.1).
 *
 * Este cliente es exclusivo del flujo Web: todas las llamadas van con
 * `credentials: 'include'` y el header `X-Client-Type: web`, que le pide a
 * la API que entregue el refresh token por cookie HttpOnly en vez de en el
 * body JSON (nunca llega a este archivo ni a ningún otro JS del navegador).
 */
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

if (!API_URL) {
  // Falla rápido y claro en vez de que las llamadas fallen en silencio.
  throw new Error('VITE_API_URL no está definida — revisa tu .env.local (o las variables de entorno en Vercel).');
}

type RequestOptions = {
  method: 'GET' | 'POST';
  body?: unknown;
  /** Access token en memoria (nunca localStorage) para endpoints protegidos. */
  accessToken?: string | null;
};

async function request(path: string, options: RequestOptions, esReintento = false): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Type': 'web',
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${apiClient.baseUrl}${path}`, {
      method: options.method,
      credentials: 'include',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiSinConexionError();
  }

  if (
    respuesta.status === 401 &&
    options.accessToken &&
    !esReintento &&
    apiClient.onSesionExpirada
  ) {
    const nuevoAccessToken = await apiClient.onSesionExpirada();
    if (nuevoAccessToken) {
      return request(path, { ...options, accessToken: nuevoAccessToken }, true);
    }
  }

  return decodificar(respuesta);
}

async function decodificar(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text();
  const cuerpo = texto ? JSON.parse(texto) : null;

  if (respuesta.ok) {
    return cuerpo;
  }

  throw new ApiError(respuesta.status, extraerMensaje(cuerpo));
}

function extraerMensaje(cuerpo: unknown): string {
  if (cuerpo && typeof cuerpo === 'object' && 'message' in cuerpo) {
    const mensaje = (cuerpo as { message: unknown }).message;
    if (Array.isArray(mensaje)) return mensaje.join(' ');
    if (typeof mensaje === 'string') return mensaje;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export const apiClient = {
  baseUrl: API_URL,

  /**
   * Lo conecta `AuthProvider` para renovar la sesión ante un 401 en un
   * endpoint protegido (misma idea que `ApiClient.onSesionExpirada` en la
   * App Flutter). Devuelve el access token nuevo, o `null` si no pudo
   * renovar (fuerza logout).
   */
  onSesionExpirada: null as (() => Promise<string | null>) | null,

  get(path: string, opts?: { accessToken?: string | null }) {
    return request(path, { method: 'GET', accessToken: opts?.accessToken });
  },

  post(path: string, body?: unknown, opts?: { accessToken?: string | null }) {
    return request(path, { method: 'POST', body, accessToken: opts?.accessToken });
  },
};
