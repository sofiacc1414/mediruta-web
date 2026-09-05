import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Input } from '../../../shared/components/Input';
import { LockIcon, MailIcon } from '../../../shared/components/icons';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

/** G03/G04 de HU-01 — login del panel administrativo (solo ROOT/ADMINISTRADOR). */
export function LoginPage() {
  const { estado, login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (estado.tipo === 'autenticado') {
      navigate('/admin', { replace: true });
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
    <main className="lp-login-page">
      <div className="lp-login-container">
        {/* ===== BOTÓN VOLVER ===== */}
        <button 
          className="lp-login-back" 
          onClick={() => navigate('/')}
          aria-label="Volver al inicio"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>

        {/* ===== LADO IZQUIERDO: IMAGEN ===== */}
        <div className="lp-login-image">
          <div className="lp-login-image-overlay" />
          <img 
            src="/images/Login.jpg" 
            alt="MediRuta - Entrega de medicamentos" 
            className="lp-login-image-bg"
          />
          <div className="lp-login-image-content">
            <h2>
              Tu medicamento, <br />
              <span className="lp-login-image-highlight">contigo y a tiempo.</span>
            </h2>
            <p>Accede al panel administrativo de MediRuta</p>
          </div>
        </div>

        {/* ===== LADO DERECHO: FORMULARIO ===== */}
        <div className="lp-login-form">
          <div className="lp-login-form-header">
            <h1>Accede a tu cuenta</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {estado.tipo === 'anonimo' && estado.error ? (
            <Alert tono="error">{estado.error}</Alert>
          ) : null}

          <form onSubmit={onSubmit} className="lp-login-form-fields">
            <Input
              label="Correo electrónico"
              type="email"
              icon={<MailIcon />}
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={enviando}
              placeholder="tu@correo.com"
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
              placeholder="••••••••"
            />

            <button type="submit" disabled={enviando} className="lp-login-btn">
              {enviando ? 'Ingresando…' : 'Entrar'}
            </button>

            <Link
              to="/recuperar-contrasena"
              className="lp-login-forgot"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </form>

          <div className="lp-login-form-footer">
            <p>¿No tienes cuenta? <Link to="/recuperar-contrasena">Contacta con el administrador</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}