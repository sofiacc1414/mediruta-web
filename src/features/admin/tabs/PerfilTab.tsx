import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Input } from '../../../shared/components/Input';
import { LockResetIcon, MailIcon, PersonIcon, PinIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { cambiarContrasena } from '../../usuarios/api/auth.api';
import {
  actualizarDatosComunes,
  obtenerPerfil,
  subirFotoPerfil,
  type Perfil,
} from '../../usuarios/api/perfil.api';
import { useAuth } from '../../usuarios/hooks/useAuth';
import './PerfilTab.css';

const ETIQUETAS_ROL: Record<string, string> = {
  ROOT: 'Root',
  ADMINISTRADOR: 'Administrador',
};

export function PerfilTab() {
  const { estado } = useAuth();
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [datosGuardados, setDatosGuardados] = useState(false);

  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [errorPoliticaPassword, setErrorPoliticaPassword] = useState<string | null>(null);
  const [passwordCambiada, setPasswordCambiada] = useState(false);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorCarga(null);
    obtenerPerfil(estado.accessToken)
      .then((datos) => {
        setPerfil(datos);
        setNombreCompleto(datos.nombreCompleto ?? '');
        setTelefono(datos.telefono ?? '');
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorCarga(err.message);
        } else {
          throw err;
        }
      });
  }, [estado]);

  useEffect(() => {
    if (perfil === null) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  async function onElegirFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    setSubiendoFoto(true);
    setErrorFoto(null);
    try {
      await subirFotoPerfil(accessToken, archivo);
      cargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setErrorFoto(err.message);
      } else {
        throw err;
      }
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function onGuardarDatos(evento: FormEvent) {
    evento.preventDefault();
    setGuardandoDatos(true);
    setErrorDatos(null);
    setDatosGuardados(false);
    try {
      await actualizarDatosComunes(accessToken, nombreCompleto, telefono);
      setDatosGuardados(true);
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setErrorDatos(err.message);
      } else {
        throw err;
      }
    } finally {
      setGuardandoDatos(false);
    }
  }

  async function onCambiarPassword(evento: FormEvent) {
    evento.preventDefault();
    const errorPolitica = validarPassword(nuevaPassword);
    setErrorPoliticaPassword(errorPolitica);
    setErrorPassword(null);
    setPasswordCambiada(false);
    if (errorPolitica) return;

    setCambiandoPassword(true);
    try {
      await cambiarContrasena(accessToken, passwordActual, nuevaPassword);
      setPasswordActual('');
      setNuevaPassword('');
      setPasswordCambiada(true);
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setErrorPassword(err.message);
      } else {
        throw err;
      }
    } finally {
      setCambiandoPassword(false);
    }
  }

  const rolPrincipal = estado.usuario.roles.find((r) => r.estado === 'habilitado')?.codigo;
  const nombreVisible = perfil?.nombreCompleto?.trim() || 'Mi perfil';

  return (
    <div className="lp-perfil-page">
      {/* ===== ÍCONO LATERAL FLOTANTE ===== */}
      <div className="lp-perfil-icon-side">
        <img 
          src="/images/Perfil.png" 
          alt="Perfil"
          className="lp-perfil-icon-img"
        />
      </div>

      <div className="lp-perfil-main">
        {errorCarga ? <Alert tono="error">{errorCarga}</Alert> : null}

        {/* ===== CABECERA HERO CON FOTO QUEMADA ===== */}
        <section className="lp-perfil-hero">
          <div className="lp-perfil-hero-bg"></div>
          <div className="lp-perfil-hero-overlay"></div>
          
          <div className="lp-perfil-hero-content">
            <div className="lp-perfil-avatar-wrap">
              <div className="lp-perfil-avatar">
                {/* Foto quemada de ADMINISTRADORA.jpg en el CSS */}
              </div>
              <button
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                disabled={subiendoFoto}
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto de perfil"
                className="lp-perfil-avatar-edit"
              >
                {subiendoFoto ? '…' : '📷'}
              </button>
              <input
                ref={inputArchivoRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={onElegirFoto}
                className="lp-perfil-file-input"
              />
            </div>

            <div className="lp-perfil-hero-copy">
              <h1 className="lp-perfil-nombre">{nombreVisible}</h1>
              <p className="lp-perfil-correo">{estado.usuario.correo}</p>
              {rolPrincipal ? (
                <span className="lp-perfil-badge">
                  {ETIQUETAS_ROL[rolPrincipal] ?? rolPrincipal}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        {errorFoto ? <Alert tono="error">{errorFoto}</Alert> : null}

        {/* ===== GRID DE TARJETAS ===== */}
        <div className="lp-perfil-grid">
          <form onSubmit={onGuardarDatos} className="lp-perfil-card">
            <h2 className="lp-perfil-card-titulo">
              <PersonIcon /> Información personal
            </h2>

            {errorDatos ? <Alert tono="error">{errorDatos}</Alert> : null}
            {datosGuardados ? <Alert tono="exito">Datos actualizados.</Alert> : null}

            <Input label="Correo" value={estado.usuario.correo} icon={<MailIcon />} disabled readOnly />
            <Input
              label="Nombre completo"
              icon={<PersonIcon />}
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              disabled={guardandoDatos || perfil === null}
            />
            <Input
              label="Teléfono"
              type="tel"
              icon={<PinIcon />}
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={guardandoDatos || perfil === null}
            />

            <button
              type="submit"
              className="lp-perfil-btn lp-perfil-btn-primary"
              disabled={guardandoDatos || perfil === null}
            >
              {guardandoDatos ? 'Guardando…' : 'Guardar datos'}
            </button>
          </form>

          <form onSubmit={onCambiarPassword} className="lp-perfil-card">
            <h2 className="lp-perfil-card-titulo">
              <LockResetIcon /> Seguridad
            </h2>

            {errorPassword ? <Alert tono="error">{errorPassword}</Alert> : null}
            {passwordCambiada ? <Alert tono="exito">Contraseña actualizada.</Alert> : null}

            <Input
              label="Contraseña actual"
              esPassword
              icon={<LockResetIcon />}
              autoComplete="current-password"
              required
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              disabled={cambiandoPassword}
            />
            <Input
              label="Nueva contraseña"
              esPassword
              icon={<LockResetIcon />}
              autoComplete="new-password"
              required
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              disabled={cambiandoPassword}
              errorText={errorPoliticaPassword ?? undefined}
            />

            <button
              type="submit"
              className="lp-perfil-btn lp-perfil-btn-primary"
              disabled={cambiandoPassword}
            >
              {cambiandoPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}