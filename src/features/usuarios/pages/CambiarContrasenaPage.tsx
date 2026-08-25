import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import { Input } from '../../../shared/components/Input';
import { LockResetIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { cambiarContrasena } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';

/** G06 de HU-01 — cambio de contraseña con sesión activa. La API mantiene
 * la sesión actual y revoca las demás (context.md, sección "G05 vs G06"). */
export function CambiarContrasenaPage() {
  const { estado } = useAuth();
  const navigate = useNavigate();
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    const errorPoliticaPassword = validarPassword(nuevaPassword);
    setErrorPassword(errorPoliticaPassword);
    setError(null);
    if (errorPoliticaPassword) return;

    setEnviando(true);
    try {
      if (estado.tipo !== 'autenticado') return;
      await cambiarContrasena(estado.accessToken, passwordActual, nuevaPassword);
      navigate('/admin', { replace: true });
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
        <IconBadge icon={<LockResetIcon />} />
        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Cambiar contraseña</h1>

        {error ? <Alert tono="error">{error}</Alert> : null}

        <Input
          label="Contraseña actual"
          esPassword
          icon={<LockResetIcon />}
          autoComplete="current-password"
          required
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          disabled={enviando}
        />
        <Input
          label="Nueva contraseña"
          esPassword
          icon={<LockResetIcon />}
          autoComplete="new-password"
          required
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
          disabled={enviando}
          errorText={errorPassword ?? undefined}
        />

        <Button type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button type="button" variante="secondary" onClick={() => navigate(-1)} disabled={enviando}>
          Cancelar
        </Button>
      </form>
    </main>
  );
}
