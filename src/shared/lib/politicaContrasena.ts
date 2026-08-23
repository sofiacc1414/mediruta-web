/**
 * Espejo de `politica-contrasena.ts` de la API — solo para dar feedback
 * inmediato en el formulario. La autoridad final sigue siendo la API.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const PATRON = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const MENSAJE_PATRON =
  'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.';

/** Devuelve el mensaje de error correspondiente, o `null` si es válida. */
export function validarPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (!PATRON.test(password)) {
    return MENSAJE_PATRON;
  }
  return null;
}
