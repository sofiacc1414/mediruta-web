import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
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

const ETIQUETAS_ROL: Record<string, string> = {
  ROOT: 'Root',
  ADMINISTRADOR: 'Administrador',
};

/** "Mi perfil" — foto, datos comunes (nombre/teléfono) y cambio de
 * contraseña, todo en una sola pantalla (antes el cambio de
 * contraseña era su propia página aparte). */
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
  const inicial = (perfil?.nombreCompleto ?? estado.usuario.correo).charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <h1>Mi perfil</h1>
        <p>
          {estado.usuario.correo}
          {rolPrincipal ? ` · ${ETIQUETAS_ROL[rolPrincipal] ?? rolPrincipal}` : ''}
        </p>
      </div>

      {errorCarga ? <Alert tono="error">{errorCarga}</Alert> : null}

      <div className="admin-card" style={{ maxWidth: 420, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--color-sky-blue)',
              color: 'var(--color-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '2rem',
              overflow: 'hidden',
            }}
          >
            {perfil?.fotoPerfilUrl ? (
              <img
                src={perfil.fotoPerfilUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              inicial
            )}
          </div>
          <button
            type="button"
            onClick={() => inputArchivoRef.current?.click()}
            disabled={subiendoFoto}
            aria-label="Cambiar foto de perfil"
            title="Cambiar foto de perfil"
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid var(--color-white)',
              background: 'var(--color-navy)',
              color: 'var(--color-white)',
              cursor: subiendoFoto ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}
          >
            {subiendoFoto ? '…' : '📷'}
          </button>
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onElegirFoto}
            style={{ display: 'none' }}
          />
        </div>
        {errorFoto ? <Alert tono="error">{errorFoto}</Alert> : null}
      </div>

      <form onSubmit={onGuardarDatos} className="admin-card" style={{ maxWidth: 420 }}>
        <h2>Datos</h2>

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

        <Button type="submit" disabled={guardandoDatos || perfil === null}>
          {guardandoDatos ? 'Guardando…' : 'Guardar datos'}
        </Button>
      </form>

      <form onSubmit={onCambiarPassword} className="admin-card" style={{ maxWidth: 420 }}>
        <h2>Cambiar contraseña</h2>

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

        <Button type="submit" disabled={cambiandoPassword}>
          {cambiandoPassword ? 'Guardando…' : 'Cambiar contraseña'}
        </Button>
      </form>
    </div>
  );
}
