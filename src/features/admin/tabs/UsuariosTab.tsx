import { useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MailIcon, PersonIcon, PinIcon, UsersIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { useAuth } from '../../usuarios/hooks/useAuth';
import { crearAdministrador } from '../api/usuariosAdminApi';

/** "Usuarios" — solo ROOT crea cuentas ADMINISTRADOR (la API también lo
 * exige, ver `@Roles('ROOT')` en `UsuariosAdminController.crear`; este
 * tab en sí solo se ofrece en el sidebar a cuentas ROOT — ver
 * `AdminShell`). */
export function UsuariosTab() {
  const { estado } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [creado, setCreado] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    const errorPolitica = validarPassword(password);
    setErrorPassword(errorPolitica);
    setError(null);
    setCreado(null);
    if (errorPolitica) return;

    setEnviando(true);
    try {
      if (estado.tipo !== 'autenticado') return;
      const resultado = await crearAdministrador(estado.accessToken, {
        correo,
        password,
        nombreCompleto: nombreCompleto.trim() || undefined,
        telefono: telefono.trim() || undefined,
      });
      setCreado(resultado.correo);
      setCorreo('');
      setPassword('');
      setNombreCompleto('');
      setTelefono('');
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <h1>Usuarios</h1>
        <p style={{ color: 'var(--color-teal)' }}>Creá una nueva cuenta de administrador.</p>
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          background: 'var(--color-white)',
          borderRadius: 16,
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          maxWidth: 420,
        }}
      >
        {error ? <Alert tono="error">{error}</Alert> : null}
        {creado ? <Alert tono="exito">Se creó la cuenta de {creado}.</Alert> : null}

        <Input
          label="Correo"
          type="email"
          icon={<MailIcon />}
          autoComplete="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={enviando}
        />
        <Input
          label="Contraseña"
          esPassword
          icon={<PinIcon />}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={enviando}
          errorText={errorPassword ?? undefined}
        />
        <Input
          label="Nombre completo (opcional)"
          icon={<PersonIcon />}
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          disabled={enviando}
        />
        <Input
          label="Teléfono (opcional)"
          type="tel"
          icon={<UsersIcon />}
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          disabled={enviando}
        />

        <Button type="submit" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear administrador'}
        </Button>
      </form>
    </div>
  );
}
