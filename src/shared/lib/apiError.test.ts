import { describe, expect, it } from 'vitest';
import { ApiError, ApiSinConexionError } from './apiError';

describe('ApiError', () => {
  it('expone el statusCode y el message tal cual los mandó la API', () => {
    const error = new ApiError(422, 'La solicitud está incompleta.');

    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('La solicitud está incompleta.');
    expect(error.name).toBe('ApiError');
  });

  it('esNoAutorizado es true solo para 401', () => {
    expect(new ApiError(401, 'x').esNoAutorizado).toBe(true);
    expect(new ApiError(403, 'x').esNoAutorizado).toBe(false);
    expect(new ApiError(500, 'x').esNoAutorizado).toBe(false);
  });
});

describe('ApiSinConexionError', () => {
  it('trae un mensaje fijo, sin depender de ningún dato del request', () => {
    const error = new ApiSinConexionError();

    expect(error.name).toBe('ApiSinConexionError');
    expect(error.message).toContain('No se pudo conectar');
  });
});
