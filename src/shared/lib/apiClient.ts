import { ApiError, ApiSinConexionError } from './apiError';

/**
 * Cliente base para hablar con mediruta-api. La URL sale de VITE_API_URL
 * (ver .env.example) — nunca se llama a Supabase directamente desde aquí
 * (DOCS/context.md, Parte B, sección 4.1).
 *
 * Sin header `X-Client-Type: web` a propósito: la API lo usa para decidir
 * si entrega el refresh token por cookie HttpOnly (flujo descartado, ver
 * refreshTokenStorage.ts) en vez de en el body — acá se lo trata igual
 * que a la App Flutter, así que no hace falta `credentials: 'include'`
 * tampoco (no depende de ninguna cookie cross-site).
 */
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

if (!API_URL) {
  // Falla rápido y claro en vez de que las llamadas fallen en silencio.
  throw new Error('VITE_API_URL no está definida — revisa tu .env.local (o las variables de entorno en Vercel).');
}

type RequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Access token en memoria (nunca localStorage) para endpoints protegidos. */
  accessToken?: string | null;
};

/**
 * Renovación en vuelo compartida entre requests concurrentes — el
 * refresh token de la API es de un solo uso (rota en cada llamada a
 * /auth/refrescar), así que si dos componentes piden datos al mismo
 * tiempo y ambos reciben 401 porque el access token venció (típico al
 * entrar al panel, donde varios tabs/tarjetas disparan requests
 * autenticados juntos), sin esto cada uno llamaría a onSesionExpirada
 * por su cuenta con el mismo refresh token viejo: el primero gana y lo
 * rota, el segundo llega con el token ya usado y la API lo rechaza con
 * 401 — un "No autorizado." visible pese a que la sesión sigue siendo
 * válida. Con esto, todos esperan el mismo resultado de la única
 * renovación en curso.
 */
let renovacionEnCurso: Promise<string | null> | null = null;

function renovarSesion(): Promise<string | null> {
  if (!renovacionEnCurso) {
    renovacionEnCurso = apiClient.onSesionExpirada!().finally(() => {
      renovacionEnCurso = null;
    });
  }
  return renovacionEnCurso;
}

async function request(path: string, options: RequestOptions, esReintento = false): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  // FormData (subida de archivos) nunca se serializa a JSON, y el
  // header Content-Type con su boundary lo arma fetch solo — ponerlo a
  // mano rompe el multipart.
  const esFormData = options.body instanceof FormData;
  if (!esFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${apiClient.baseUrl}${path}`, {
      method: options.method,
      headers,
      body: esFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
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
    const nuevoAccessToken = await renovarSesion();
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

  patch(path: string, body?: unknown, opts?: { accessToken?: string | null }) {
    return request(path, { method: 'PATCH', body, accessToken: opts?.accessToken });
  },

  put(path: string, body?: unknown, opts?: { accessToken?: string | null }) {
    return request(path, { method: 'PUT', body, accessToken: opts?.accessToken });
  },

  delete(path: string, opts?: { accessToken?: string | null }) {
    return request(path, { method: 'DELETE', accessToken: opts?.accessToken });
  },

  /** Subida de archivo (foto de perfil, documentos, etc.) — multipart,
   * nunca JSON. `campos` agrega texto adicional al form (ej. `lado`,
   * `tipo`), mismo criterio que `postMultipart` de la App Flutter. */
  postMultipart(
    path: string,
    archivo: File,
    opts?: { campos?: Record<string, string>; accessToken?: string | null },
  ) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    for (const [clave, valor] of Object.entries(opts?.campos ?? {})) {
      formData.append(clave, valor);
    }
    return request(path, { method: 'POST', body: formData, accessToken: opts?.accessToken });
  },
};
