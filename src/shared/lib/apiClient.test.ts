import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { ApiSinConexionError } from './apiError';

function respuestaOk(cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status: 200 });
}

function respuestaError(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status });
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    apiClient.onSesionExpirada = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET arma la URL con baseUrl + path, sin Authorization si no hay token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(respuestaOk({ ok: true }));

    const resultado = await apiClient.get('/solicitudes');

    expect(resultado).toEqual({ ok: true });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${apiClient.baseUrl}/solicitudes`);
    expect(init?.method).toBe('GET');
    expect((init?.headers as Record<string, string> | undefined)?.Authorization).toBeUndefined();
  });

  it('con accessToken, manda el header Authorization: Bearer', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(respuestaOk([]));

    await apiClient.get('/solicitudes', { accessToken: 'token-123' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string> | undefined)?.Authorization).toBe('Bearer token-123');
  });

  it('una respuesta no-ok lanza ApiError con el status y el message de la API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      respuestaError(422, { message: 'La solicitud está incompleta.' }),
    );

    await expect(apiClient.get('/solicitudes/x')).rejects.toMatchObject({
      statusCode: 422,
      message: 'La solicitud está incompleta.',
    });
  });

  it('un message en array (validación) se junta en un solo texto', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      respuestaError(400, { message: ['El correo es obligatorio.', 'La contraseña es obligatoria.'] }),
    );

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
      message: 'El correo es obligatorio. La contraseña es obligatoria.',
    });
  });

  it('si fetch falla (sin red/CORS/etc.), lanza ApiSinConexionError', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/solicitudes')).rejects.toBeInstanceOf(ApiSinConexionError);
  });

  it('ante un 401, renueva con onSesionExpirada y reintenta una sola vez con el token nuevo', async () => {
    apiClient.onSesionExpirada = vi.fn().mockResolvedValue('token-nuevo');
    vi.mocked(fetch)
      .mockResolvedValueOnce(respuestaError(401, { message: 'No autorizado.' }))
      .mockResolvedValueOnce(respuestaOk({ ok: true }));

    const resultado = await apiClient.get('/solicitudes', { accessToken: 'token-viejo' });

    expect(resultado).toEqual({ ok: true });
    expect(apiClient.onSesionExpirada).toHaveBeenCalledTimes(1);
    // El reintento manda el token nuevo, no el viejo.
    const [, initReintento] = vi.mocked(fetch).mock.calls[1];
    expect((initReintento?.headers as Record<string, string> | undefined)?.Authorization).toBe('Bearer token-nuevo');
  });

  it('si onSesionExpirada no logra renovar (null), propaga el 401 como ApiError', async () => {
    apiClient.onSesionExpirada = vi.fn().mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(respuestaError(401, { message: 'No autorizado.' }));

    await expect(apiClient.get('/solicitudes', { accessToken: 'token-viejo' })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(fetch).toHaveBeenCalledTimes(1); // sin reintento
  });

  it(
    'dos 401 concurrentes comparten una única renovación (no dos, aunque el refresh token sea de un solo uso)',
    async () => {
      let resolverRenovacion!: (token: string) => void;
      const onSesionExpirada = vi.fn(
        () => new Promise<string | null>((resolve) => { resolverRenovacion = resolve; }),
      );
      apiClient.onSesionExpirada = onSesionExpirada;

      vi.mocked(fetch)
        .mockResolvedValueOnce(respuestaError(401, {})) // request A, primer intento
        .mockResolvedValueOnce(respuestaError(401, {})) // request B, primer intento
        .mockResolvedValueOnce(respuestaOk({ quien: 'A' })) // reintento A
        .mockResolvedValueOnce(respuestaOk({ quien: 'B' })); // reintento B

      const promesaA = apiClient.get('/a', { accessToken: 'viejo' });
      const promesaB = apiClient.get('/b', { accessToken: 'viejo' });

      // Deja que ambos requests iniciales lleguen a pedir la renovación
      // antes de resolverla — es la ventana de la carrera real.
      await vi.waitFor(() => expect(onSesionExpirada).toHaveBeenCalledTimes(1));
      resolverRenovacion('token-nuevo');

      const [resultadoA, resultadoB] = await Promise.all([promesaA, promesaB]);

      expect(resultadoA).toEqual({ quien: 'A' });
      expect(resultadoB).toEqual({ quien: 'B' });
      // La única llamada real a onSesionExpirada, compartida por las dos.
      expect(onSesionExpirada).toHaveBeenCalledTimes(1);
    },
  );

  it('subida multipart no fija Content-Type a mano (lo arma fetch con el boundary)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(respuestaOk({ url: 'x' }));
    const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });

    await apiClient.postMultipart('/perfil/foto', archivo, { accessToken: 'token' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string> | undefined)?.['Content-Type']).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);
  });
});
