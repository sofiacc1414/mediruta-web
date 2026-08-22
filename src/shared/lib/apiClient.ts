/**
 * Cliente base para hablar con mediruta-api. La URL sale de VITE_API_URL
 * (ver .env.example) — nunca se llama a Supabase directamente desde aquí
 * (DOCS/context.md, Parte B, sección 4.1).
 */
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

if (!API_URL) {
  // Falla rápido y claro en vez de que las llamadas fallen en silencio.
  throw new Error('VITE_API_URL no está definida — revisa tu .env.local (o las variables de entorno en Vercel).');
}

export const apiClient = {
  baseUrl: API_URL,

  // Los métodos get/post/patch/delete concretos (con manejo de headers,
  // token de sesión, y parsing de errores) se implementan junto con el
  // primer caso de uso que los necesite, no antes — ver "planificación
  // obligatoria antes de implementar" (context.md, sección 12).
};
