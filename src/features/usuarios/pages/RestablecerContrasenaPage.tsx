import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import { Input } from '../../../shared/components/Input';
import { LockIcon, MailCheckIcon, PinIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { restablecerContrasena } from '../api/auth.api';

/** G05 (paso 2) de HU-01 — consume el OTP y fija una nueva contraseña.
 * Recibe el correo por `location.state` desde RecuperarContrasenaPage. */
export function RestablecerContrasenaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const correo = (location.state as { correo?: string } | null)?.correo ?? '';

  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    const errorPoliticaPassword = validarPassword(nuevaPassword);
    setErrorPassword(errorPoliticaPassword);
    setError(null);
    if (errorPoliticaPassword) return;

    setEnviando(true);
    try {
      await restablecerContrasena(correo, codigo, nuevaPassword);
      navigate('/login', { replace: true });
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

  if (!correo) {
    return (
      <main
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <Alert tono="error">
          Primero solicita un código desde{' '}
          <a href="/recuperar-contrasena" style={{ color: 'var(--color-navy)' }}>
            recuperar contraseña
          </a>
          .
        </Alert>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          background: 'var(--color-white)',
          padding: 'var(--space-8)',
          borderRadius: 24,
          boxShadow: '0 4px 24px rgba(47, 65, 86, 0.12)',
        }}
      >
        <IconBadge icon={<MailCheckIcon />} />
        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Restablecer contraseña</h1>
        <p style={{ color: 'var(--color-teal)', fontSize: '0.9rem', textAlign: 'center' }}>
          Código enviado a {correo}
        </p>

        {error ? <Alert tono="error">{error}</Alert> : null}

        <Input
          label="Código de 6 dígitos"
          inputMode="numeric"
          icon={<PinIcon />}
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          disabled={enviando}
        />
        <Input
          label="Nueva contraseña"
          esPassword
          icon={<LockIcon />}
          autoComplete="new-password"
          required
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
          disabled={enviando}
          errorText={errorPassword ?? undefined}
        />

        <Button type="submit" disabled={enviando}>
          {enviando ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>
      </form>
    </main>
  );
}
