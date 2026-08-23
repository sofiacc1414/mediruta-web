import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { solicitarRecuperacionContrasena } from '../api/auth.api';

/** G05 (paso 1) de HU-01 — solicita el OTP de recuperación por correo.
 * La API responde el mismo mensaje exista o no la cuenta (anti-
 * enumeración) — esta pantalla nunca revela si el correo existe. */
export function RecuperarContrasenaPage() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await solicitarRecuperacionContrasena(correo);
      setSolicitudEnviada(true);
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
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          background: 'var(--color-white)',
          padding: 'var(--space-8)',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(47, 65, 86, 0.12)',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Recuperar contraseña</h1>

        {error ? <Alert tono="error">{error}</Alert> : null}

        {solicitudEnviada ? (
          <>
            <Alert tono="exito">
              Si el correo está registrado, recibirás un código de recuperación.
            </Alert>
            <Button onClick={() => navigate('/restablecer-contrasena', { state: { correo } })}>
              Ya tengo el código
            </Button>
          </>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <p style={{ color: 'var(--color-teal)', fontSize: '0.9rem' }}>
              Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
            </p>
            <Input
              label="Correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={enviando}
            />
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar código'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
