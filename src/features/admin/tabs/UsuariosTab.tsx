import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MailIcon, PersonIcon, PinIcon, UsersIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  crearAdministrador,
  listarAdministradores,
  obtenerAdministrador,
  type AdministradorDetalle,
  type AdministradorResumen,
} from '../api/usuariosAdminApi';

const ETIQUETAS_ESTADO_CUENTA: Record<string, string> = {
  activa: 'Activa',
  bloqueada: 'Bloqueada',
  desactivada: 'Desactivada',
};

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * "Usuarios" — administrar las cuentas ADMINISTRADOR ya creadas: lista
 * + ficha de detalle, con estado local en vez de rutas (mismo criterio
 * que `DomiciliariosTab`). Solo ROOT ve esta pestaña (ver `AdminShell`)
 * y solo ROOT puede crear una cuenta nueva; ver la lista/ficha es para
 * cualquier admin, pero acá solo entra ROOT.
 */
export function UsuariosTab() {
  const { estado } = useAuth();
  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'detalle'; id: string }>({
    tipo: 'lista',
  });
  const [administradores, setAdministradores] = useState<AdministradorResumen[] | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const cargarLista = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorLista(null);
    listarAdministradores(estado.accessToken)
      .then(setAdministradores)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorLista(err.message);
        } else {
          throw err;
        }
      });
  }, [estado]);

  useEffect(() => {
    if (administradores === null) cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;

  if (vista.tipo === 'detalle') {
    return <AdministradorFicha usuarioId={vista.id} onVolver={() => setVista({ tipo: 'lista' })} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-card-header">
        <div className="admin-page-header" style={{ margin: 0 }}>
          <h1>Usuarios</h1>
          <p>Administrá las cuentas de administrador ya creadas.</p>
        </div>
        <Button style={{ width: 'auto' }} onClick={() => setMostrarFormulario((v) => !v)}>
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo administrador'}
        </Button>
      </div>

      {mostrarFormulario ? (
        <FormularioCrearAdministrador
          onCreado={() => {
            setMostrarFormulario(false);
            cargarLista();
          }}
        />
      ) : null}

      {errorLista ? <Alert tono="error">{errorLista}</Alert> : null}

      {administradores === null && !errorLista ? <p className="admin-muted">Cargando…</p> : null}

      {administradores?.length === 0 ? (
        <div className="admin-card admin-empty">Todavía no hay cuentas de administrador creadas.</div>
      ) : null}

      {administradores && administradores.length > 0 ? (
        <div className="admin-card admin-table-wrap" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Creada</th>
              </tr>
            </thead>
            <tbody>
              {administradores.map((admin) => (
                <tr
                  key={admin.id}
                  className="admin-table-row-clickable admin-table-row-button"
                  onClick={() => setVista({ tipo: 'detalle', id: admin.id })}
                >
                  <td style={{ fontWeight: 600 }}>{admin.nombreCompleto ?? 'Sin nombre registrado'}</td>
                  <td>{admin.correo}</td>
                  <td>{ETIQUETAS_ESTADO_CUENTA[admin.estadoCuenta] ?? admin.estadoCuenta}</td>
                  <td className="admin-muted">{formatearFecha(admin.creadoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function FormularioCrearAdministrador({ onCreado }: { onCreado: () => void }) {
  const { estado } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  if (estado.tipo !== 'autenticado') return null;

  async function onSubmit(evento: FormEvent) {
    evento.preventDefault();
    const errorPolitica = validarPassword(password);
    setErrorPassword(errorPolitica);
    setError(null);
    if (errorPolitica) return;

    setEnviando(true);
    try {
      if (estado.tipo !== 'autenticado') return;
      await crearAdministrador(estado.accessToken, {
        correo,
        password,
        nombreCompleto: nombreCompleto.trim() || undefined,
        telefono: telefono.trim() || undefined,
      });
      onCreado();
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
    <form onSubmit={onSubmit} className="admin-card" style={{ maxWidth: 420 }}>
      <h2>Nuevo administrador</h2>

      {error ? <Alert tono="error">{error}</Alert> : null}

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
  );
}

function AdministradorFicha({ usuarioId, onVolver }: { usuarioId: string; onVolver: () => void }) {
  const { estado } = useAuth();
  const [ficha, setFicha] = useState<AdministradorDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    obtenerAdministrador(estado.accessToken, usuarioId)
      .then(setFicha)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado, usuarioId]);

  if (estado.tipo !== 'autenticado') return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <button type="button" className="admin-back-link" onClick={onVolver}>
        ← Volver a usuarios
      </button>

      {error ? <Alert tono="error">{error}</Alert> : null}
      {!ficha && !error ? <p className="admin-muted">Cargando…</p> : null}

      {ficha ? (
        <div className="admin-card" style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--color-sky-blue)',
                color: 'var(--color-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.5rem',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {ficha.fotoPerfilUrl ? (
                <img src={ficha.fotoPerfilUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (ficha.nombreCompleto ?? ficha.correo).charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 style={{ marginBottom: 2 }}>{ficha.nombreCompleto ?? 'Sin nombre registrado'}</h1>
              <span className="admin-muted">{ETIQUETAS_ESTADO_CUENTA[ficha.estadoCuenta] ?? ficha.estadoCuenta}</span>
            </div>
          </div>
          <p>Correo: {ficha.correo}</p>
          <p>Teléfono: {ficha.telefono ?? '—'}</p>
          <p className="admin-muted">Cuenta creada el {formatearFecha(ficha.creadoEn)}</p>
        </div>
      ) : null}
    </div>
  );
}
