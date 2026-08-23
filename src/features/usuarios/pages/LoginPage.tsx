import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { IconBadge } from '../../../shared/components/IconBadge';
import { Input } from '../../../shared/components/Input';
import { LockIcon, MailIcon } from '../../../shared/components/icons';
import { useAuth } from '../hooks/useAuth';

/** G03/G04 de HU-01 — login del panel administrativo (solo ROOT/ADMINISTRADOR). */
export function LoginPage() {
  const { estado, login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estado.tipo === 'autenticado') {
      navigate('/', { replace: true });
    }
  }, [estado.tipo, navigate]);

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    try {
      await login(correo, password);
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
        <IconBadge icon={<LockIcon />} />
        <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Iniciar sesión</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-teal)', marginTop: -8 }}>
          Bienvenido de nuevo a MediRuta
        </p>

        {estado.tipo === 'anonimo' && estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

        <Input
          label="Correo electrónico"
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
          icon={<LockIcon />}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={enviando}
        />

        <Button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Entrar'}
        </Button>

        <Link
          to="/recuperar-contrasena"
          style={{ textAlign: 'center', color: 'var(--color-teal)', fontSize: '0.9rem' }}
        >
          Olvidé mi contraseña
        </Link>
      </form>
    </main>
  );
}
