import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Input } from '../../../shared/components/Input';
import { LockIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { restablecerContrasena } from '../api/auth.api';
import './RestablecerContrasenaPage.css';

/** G05 (paso 2) de HU-01 — consume el OTP y fija una nueva contraseña. */
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
      <main className="lp-reset-page">
        <div className="lp-reset-container">
          <div className="lp-reset-error">
            <Alert tono="error">
              Primero solicita un código desde{' '}
              <a href="/recuperar-contrasena" style={{ color: '#2F4156' }}>
                recuperar contraseña
              </a>
              .
            </Alert>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="lp-reset-page">
      <div className="lp-reset-container">
        {/* ===== BOTÓN VOLVER ===== */}
        <button 
          className="lp-reset-back" 
          onClick={() => navigate('/recuperar-contrasena')}
          aria-label="Volver"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>

        {/* ===== LADO IZQUIERDO: IMAGEN ===== */}
        <div className="lp-reset-image">
          <div className="lp-reset-image-overlay" />
          <img 
            src="/images/Login.jpg" 
            alt="MediRuta" 
            className="lp-reset-image-bg"
          />
          <div className="lp-reset-image-content">
            <h2>
              Crea una nueva <br />
              <span className="lp-reset-image-highlight">contraseña</span>
            </h2>
            <p>Ingresa el código y tu nueva contraseña</p>
          </div>
        </div>

        {/* ===== LADO DERECHO: FORMULARIO ===== */}
        <div className="lp-reset-form">
          <div className="lp-reset-form-header">
            <div className="lp-reset-form-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h1>Restablecer contraseña</h1>
            <p>
              Código enviado a <strong>{correo}</strong>
            </p>
          </div>

          {error ? <Alert tono="error">{error}</Alert> : null}

          <form onSubmit={onSubmit} className="lp-reset-form-fields">
            <Input
              label="Código de 6 dígitos"
              inputMode="numeric"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 4 8 12 8 12s8-8 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              disabled={enviando}
              placeholder="123456"
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
              placeholder="••••••••"
            />

            <button type="submit" disabled={enviando} className="lp-reset-btn">
              {enviando ? 'Restableciendo…' : 'Restablecer contraseña'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}