import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MailIcon, PersonIcon, PinIcon, UsersIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { validarPassword } from '../../../shared/lib/politicaContrasena';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  bloquearCuenta,
  desbloquearCuenta,
  listarCuentasAdmin,
  obtenerCuentaAdmin,
  type CodigoRol,
  type CuentaAdminDetalle,
  type CuentaAdminResumen,
} from '../api/cuentasAdminApi';
import { crearAdministrador } from '../api/usuariosAdminApi';

const ETIQUETAS_ESTADO_CUENTA: Record<string, string> = {
  activa: 'Activa',
  bloqueada: 'Bloqueada',
  desactivada: 'Desactivada',
};

const ETIQUETAS_ROL: Record<CodigoRol, string> = {
  PACIENTE: 'Paciente',
  DOMICILIARIO: 'Domiciliario',
  ADMINISTRADOR: 'Administrador',
  ROOT: 'Root',
};

const FILTROS_ROL: { valor: CodigoRol | 'TODOS'; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'PACIENTE', etiqueta: 'Pacientes' },
  { valor: 'DOMICILIARIO', etiqueta: 'Domiciliarios' },
  { valor: 'ADMINISTRADOR', etiqueta: 'Administradores' },
];

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function esCuentaPrivilegiada(cuenta: { roles: CodigoRol[] }) {
  return cuenta.roles.includes('ADMINISTRADOR') || cuenta.roles.includes('ROOT');
}

/**
 * "Usuarios" — administrar cualquier cuenta (Paciente/Domiciliario/
 * Administrador): lista filtrable por rol + ficha de detalle, con
 * estado local en vez de rutas (mismo criterio que `DomiciliariosTab`).
 * Bloquear/desbloquear es para cualquier admin, salvo sobre una cuenta
 * Administrador/ROOT — eso, igual que crear una, es solo ROOT (la API
 * también lo exige; acá solo se oculta la acción para no prometer algo
 * que el backend va a rechazar).
 */
export function UsuariosTab() {
  const { estado } = useAuth();
  const esRoot = estado.tipo === 'autenticado' && estado.usuario.roles.some(
    (r) => r.codigo === 'ROOT' && r.estado === 'habilitado',
  );

  const [vista, setVista] = useState<{ tipo: 'lista' } | { tipo: 'detalle'; id: string }>({
    tipo: 'lista',
  });
  const [filtroRol, setFiltroRol] = useState<CodigoRol | 'TODOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cuentas, setCuentas] = useState<CuentaAdminResumen[] | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const cargarLista = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorLista(null);
    listarCuentasAdmin(estado.accessToken, {
      rol: filtroRol === 'TODOS' ? undefined : filtroRol,
      busqueda: busqueda.trim() || undefined,
    })
      .then(setCuentas)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorLista(err.message);
        } else {
          throw err;
        }
      });
  }, [estado, filtroRol, busqueda]);

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol]);

  if (estado.tipo !== 'autenticado') return null;

  if (vista.tipo === 'detalle') {
    return (
      <CuentaFicha
        usuarioId={vista.id}
        esRoot={esRoot}
        onVolver={() => setVista({ tipo: 'lista' })}
        onCambioEstado={cargarLista}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-card-header">
        <div className="admin-page-header" style={{ margin: 0 }}>
          <h1>Usuarios</h1>
          <p>Administrá las cuentas de pacientes, domiciliarios y administradores.</p>
        </div>
        {esRoot ? (
          <Button style={{ width: 'auto' }} onClick={() => setMostrarFormulario((v) => !v)}>
            {mostrarFormulario ? 'Cancelar' : '+ Nuevo administrador'}
          </Button>
        ) : null}
      </div>

      {mostrarFormulario ? (
        <FormularioCrearAdministrador
          onCreado={() => {
            setMostrarFormulario(false);
            setFiltroRol('ADMINISTRADOR');
            cargarLista();
          }}
        />
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
        {FILTROS_ROL.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltroRol(f.valor)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '1.5px solid var(--color-navy)',
              cursor: 'pointer',
              background: filtroRol === f.valor ? 'var(--color-navy)' : 'transparent',
              color: filtroRol === f.valor ? 'var(--color-white)' : 'var(--color-navy)',
            }}
          >
            {f.etiqueta}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cargarLista();
          }}
          style={{ marginLeft: 'auto' }}
        >
          <input
            type="search"
            placeholder="Buscar por nombre o correo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              padding: '10px 14px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-navy)',
              background: 'var(--color-beige)',
              color: 'var(--color-navy)',
              minWidth: 220,
            }}
          />
        </form>
      </div>

      {errorLista ? <Alert tono="error">{errorLista}</Alert> : null}

      {cuentas === null && !errorLista ? <p className="admin-muted">Cargando…</p> : null}

      {cuentas?.length === 0 ? (
        <div className="admin-card admin-empty">No hay cuentas que coincidan con este filtro.</div>
      ) : null}

      {cuentas && cuentas.length > 0 ? (
        <div className="admin-card admin-table-wrap" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creada</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => (
                <tr
                  key={cuenta.id}
                  className="admin-table-row-clickable admin-table-row-button"
                  onClick={() => setVista({ tipo: 'detalle', id: cuenta.id })}
                >
                  <td style={{ fontWeight: 600 }}>{cuenta.nombreCompleto ?? 'Sin nombre registrado'}</td>
                  <td>{cuenta.correo}</td>
                  <td className="admin-muted">{cuenta.roles.map((r) => ETIQUETAS_ROL[r]).join(', ')}</td>
                  <td>{ETIQUETAS_ESTADO_CUENTA[cuenta.estadoCuenta] ?? cuenta.estadoCuenta}</td>
                  <td className="admin-muted">{formatearFecha(cuenta.creadoEn)}</td>
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

function MiniaturaDoc({ etiqueta, url }: { etiqueta: string; url: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="admin-muted">{etiqueta}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={etiqueta}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-sky-blue)' }}
          />
        </a>
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--color-sky-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-teal)',
            fontSize: '0.7rem',
            textAlign: 'center',
          }}
        >
          No subida
        </div>
      )}
    </div>
  );
}

function CuentaFicha({
  usuarioId,
  esRoot,
  onVolver,
  onCambioEstado,
}: {
  usuarioId: string;
  esRoot: boolean;
  onVolver: () => void;
  onCambioEstado: () => void;
}) {
  const { estado } = useAuth();
  const [ficha, setFicha] = useState<CuentaAdminDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    obtenerCuentaAdmin(estado.accessToken, usuarioId)
      .then(setFicha)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
  }, [estado, usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado.tipo !== 'autenticado') return null;

  const puedeActuar = ficha ? esRoot || !esCuentaPrivilegiada(ficha) : false;

  async function onBloquear(evento: FormEvent) {
    evento.preventDefault();
    if (estado.tipo !== 'autenticado') return;
    setProcesando(true);
    setError(null);
    try {
      const resultado = await bloquearCuenta(estado.accessToken, usuarioId, motivoBloqueo);
      setMensaje(resultado.message);
      setMostrarMotivo(false);
      setMotivoBloqueo('');
      cargar();
      onCambioEstado();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setProcesando(false);
    }
  }

  async function onDesbloquear() {
    if (estado.tipo !== 'autenticado') return;
    setProcesando(true);
    setError(null);
    try {
      const resultado = await desbloquearCuenta(estado.accessToken, usuarioId);
      setMensaje(resultado.message);
      cargar();
      onCambioEstado();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <button type="button" className="admin-back-link" onClick={onVolver}>
        ← Volver a usuarios
      </button>

      {error ? <Alert tono="error">{error}</Alert> : null}
      {mensaje ? <Alert tono="exito">{mensaje}</Alert> : null}
      {!ficha && !error ? <p className="admin-muted">Cargando…</p> : null}

      {ficha ? (
        <>
          <div className="admin-card" style={{ maxWidth: 480 }}>
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
                <span className="admin-muted">
                  {ficha.roles.map((r) => ETIQUETAS_ROL[r]).join(', ')} ·{' '}
                  {ETIQUETAS_ESTADO_CUENTA[ficha.estadoCuenta] ?? ficha.estadoCuenta}
                </span>
              </div>
            </div>
            <p>Correo: {ficha.correo}</p>
            <p>Teléfono: {ficha.telefono ?? '—'}</p>
            <p className="admin-muted">Cuenta creada el {formatearFecha(ficha.creadoEn)}</p>

            {puedeActuar ? (
              ficha.estadoCuenta === 'bloqueada' ? (
                <Button
                  variante="secondary"
                  style={{ width: 'auto', alignSelf: 'flex-start' }}
                  disabled={procesando}
                  onClick={onDesbloquear}
                >
                  {procesando ? 'Desbloqueando…' : 'Desbloquear cuenta'}
                </Button>
              ) : (
                <Button
                  variante="secondary"
                  style={{ width: 'auto', alignSelf: 'flex-start' }}
                  disabled={procesando}
                  onClick={() => setMostrarMotivo((v) => !v)}
                >
                  Bloquear cuenta
                </Button>
              )
            ) : (
              <p className="admin-muted">Solo ROOT puede bloquear una cuenta de administrador.</p>
            )}

            {mostrarMotivo ? (
              <form onSubmit={onBloquear} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Input
                  label="Motivo del bloqueo"
                  required
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  disabled={procesando}
                />
                <Button type="submit" variante="secondary" disabled={procesando} style={{ width: 'auto' }}>
                  {procesando ? 'Bloqueando…' : 'Confirmar bloqueo'}
                </Button>
              </form>
            ) : null}
          </div>

          {ficha.paciente ? (
            <div className="admin-card" style={{ maxWidth: 480 }}>
              <h2>Datos de paciente</h2>
              <p>Dirección: {ficha.paciente.direccion ?? '—'}</p>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <MiniaturaDoc etiqueta="Cédula (frente)" url={ficha.paciente.cedulaFrenteUrl} />
                <MiniaturaDoc etiqueta="Cédula (reverso)" url={ficha.paciente.cedulaReversoUrl} />
              </div>
            </div>
          ) : null}

          {ficha.domiciliario ? (
            <div className="admin-card" style={{ maxWidth: 480 }}>
              <h2>Datos de domiciliario</h2>
              <p>Dirección: {ficha.domiciliario.direccion ?? '—'}</p>
              <p>Vehículo: {ficha.domiciliario.vehiculoTipo ?? '—'} · Placa {ficha.domiciliario.vehiculoPlaca ?? '—'}</p>
              <p>Disponibilidad: {ficha.domiciliario.disponible ? 'Disponible' : 'No disponible'}</p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <MiniaturaDoc etiqueta="Cédula (frente)" url={ficha.domiciliario.cedulaFrenteUrl} />
                <MiniaturaDoc etiqueta="Cédula (reverso)" url={ficha.domiciliario.cedulaReversoUrl} />
                <MiniaturaDoc etiqueta="Licencia" url={ficha.domiciliario.licenciaUrl} />
                <MiniaturaDoc etiqueta="SOAT" url={ficha.domiciliario.soatUrl} />
                <MiniaturaDoc etiqueta="Tecnomecánica" url={ficha.domiciliario.tecnicomecanicaUrl} />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
