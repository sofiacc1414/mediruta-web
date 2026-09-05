import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MailIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { solicitarRecuperacionContrasena } from '../api/auth.api';
import './RecuperarContrasenaPage.css';

/** G05 (paso 1) de HU-01 — solicita el OTP de recuperación por correo. */
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
    <main className="lp-recovery-page">
      <div className="lp-recovery-container">
        {/* ===== BOTÓN VOLVER ===== */}
        <button 
          className="lp-recovery-back" 
          onClick={() => navigate('/login')}
          aria-label="Volver al login"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>

        {/* ===== LADO IZQUIERDO: IMAGEN ===== */}
        <div className="lp-recovery-image">
          <div className="lp-recovery-image-overlay" />
          <img 
            src="/images/Login.jpg" 
            alt="MediRuta" 
            className="lp-recovery-image-bg"
          />
          <div className="lp-recovery-image-content">
            <h2>
              ¿Olvidaste tu <br />
              <span className="lp-recovery-image-highlight">contraseña?</span>
            </h2>
            <p>Te enviaremos un código para restablecerla</p>
          </div>
        </div>

        {/* ===== LADO DERECHO: FORMULARIO ===== */}
        <div className="lp-recovery-form">
          <div className="lp-recovery-form-header">
            <div className="lp-recovery-form-icon">
              {solicitudEnviada ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4L12 14.01L9 11.01" />
                  <path d="M22 4v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#567C8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              )}
            </div>
            <h1>{solicitudEnviada ? '¡Revisa tu correo!' : 'Recuperar contraseña'}</h1>
            <p>
              {solicitudEnviada 
                ? 'Te hemos enviado un código de 6 dígitos para restablecer tu contraseña.' 
                : 'Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.'}
            </p>
          </div>

          {error ? <Alert tono="error">{error}</Alert> : null}

          {solicitudEnviada ? (
            <div className="lp-recovery-success">
              <div className="lp-recovery-success-icon">📨</div>
              <p className="lp-recovery-success-text">
                Hemos enviado un código a <strong>{correo}</strong>
              </p>
              <div className="lp-recovery-success-actions">
                <Button 
                  onClick={() => navigate('/restablecer-contrasena', { state: { correo } })}
                  className="lp-recovery-btn"
                >
                  Ya tengo el código
                </Button>
                <button 
                  type="button" 
                  className="lp-recovery-resend"
                  onClick={() => {
                    setSolicitudEnviada(false);
                    setCorreo('');
                  }}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="lp-recovery-form-fields">
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
              <button type="submit" disabled={enviando} className="lp-recovery-btn">
                {enviando ? 'Enviando…' : 'Enviar código'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}