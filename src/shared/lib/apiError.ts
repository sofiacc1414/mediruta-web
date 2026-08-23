/**
 * Error de un request a la API. Expone el `message` que manda
 * `DominioHttpFilter` (errores de dominio) o el `ValidationPipe` por
 * defecto de NestJS (errores de validación) — nunca se inventa un texto
 * distinto acá, se muestra el mismo mensaje que la API decidió mandar.
 */
export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }

  get esNoAutorizado(): boolean {
    return this.statusCode === 401;
  }
}

/** La API no respondió (sin conexión, CORS, timeout, etc.). */
export class ApiSinConexionError extends Error {
  constructor() {
    super('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
    this.name = 'ApiSinConexionError';
  }
}
