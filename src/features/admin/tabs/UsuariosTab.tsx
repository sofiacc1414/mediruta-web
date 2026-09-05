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
import './UsuariosTab.css';

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
    <div className="lp-usuarios-wrapper">
      {/* ===== ÍCONO LATERAL ===== */}
      <div className="lp-usuarios-icon-side">
        <img 
          src="/images/Usuarios.png" 
          alt="Usuarios"
          className="lp-usuarios-icon-img"
        />
      </div>

      <div className="lp-usuarios-content">
        <div className="lp-usuarios-header">
          <div className="lp-usuarios-header-left">
            <h1 className="lp-usuarios-title">Usuarios</h1>
            <p className="lp-usuarios-subtitle">Administrá las cuentas de pacientes, domiciliarios y administradores.</p>
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

        <div className="lp-usuarios-filtros">
          {FILTROS_ROL.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltroRol(f.valor)}
              className="lp-usuarios-filtro-btn"
              data-activo={filtroRol === f.valor}
            >
              {f.etiqueta}
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              cargarLista();
            }}
            className="lp-usuarios-busqueda-form"
          >
            <input
              type="search"
              placeholder="Buscar por nombre o correo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="lp-usuarios-busqueda-input"
            />
          </form>
        </div>

        {errorLista ? <Alert tono="error">{errorLista}</Alert> : null}

        {cuentas === null && !errorLista ? <p className="admin-muted">Cargando…</p> : null}

        {cuentas?.length === 0 ? (
          <div className="admin-card admin-empty">No hay cuentas que coincidan con este filtro.</div>
        ) : null}

        {cuentas && cuentas.length > 0 ? (
          <div className="lp-usuarios-tabla-container">
            <table className="lp-usuarios-tabla">
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
                    onClick={() => setVista({ tipo: 'detalle', id: cuenta.id })}
                  >
                    <td style={{ fontWeight: 600 }}>{cuenta.nombreCompleto ?? 'Sin nombre registrado'}</td>
                    <td>{cuenta.correo}</td>
                    <td style={{ color: 'rgba(47, 65, 86, 0.4)' }}>{cuenta.roles.map((r) => ETIQUETAS_ROL[r]).join(', ')}</td>
                    <td>{ETIQUETAS_ESTADO_CUENTA[cuenta.estadoCuenta] ?? cuenta.estadoCuenta}</td>
                    <td style={{ color: 'rgba(47, 65, 86, 0.4)' }}>{formatearFecha(cuenta.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
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
    <form onSubmit={onSubmit} className="lp-usuarios-card">
      <h2 className="lp-usuarios-card-titulo">Nuevo administrador</h2>

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

      <Button type="submit" disabled={enviando} className="lp-usuarios-btn lp-usuarios-btn-primary">
        {enviando ? 'Creando…' : 'Crear administrador'}
      </Button>
    </form>
  );
}

function MiniaturaDoc({ etiqueta, url }: { etiqueta: string; url: string | null }) {
  return (
    <div className="lp-usuarios-miniatura">
      <span className="lp-usuarios-card-muted">{etiqueta}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={etiqueta}
            className="lp-usuarios-miniatura-img"
          />
        </a>
      ) : (
        <div className="lp-usuarios-miniatura-vacia">
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
    <div className="lp-usuarios-wrapper">
      <div className="lp-usuarios-icon-side">
        <img 
          src="/images/Usuarios.png" 
          alt="Usuarios"
          className="lp-usuarios-icon-img"
        />
      </div>

      <div className="lp-usuarios-content">
        <button type="button" className="lp-usuarios-btn lp-usuarios-btn-secondary" onClick={onVolver} style={{ alignSelf: 'flex-start', marginTop: 24 }}>
          ← Volver a usuarios
        </button>

        {error ? <Alert tono="error">{error}</Alert> : null}
        {mensaje ? <Alert tono="exito">{mensaje}</Alert> : null}
        {!ficha && !error ? <p className="admin-muted">Cargando…</p> : null}

        {ficha ? (
          <>
            <div className="lp-usuarios-card">
              <div className="lp-usuarios-perfil-header">
                <div className="lp-usuarios-avatar-grande">
                  {ficha.fotoPerfilUrl ? (
                    <img src={ficha.fotoPerfilUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (ficha.nombreCompleto ?? ficha.correo).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="lp-usuarios-nombre-perfil">{ficha.nombreCompleto ?? 'Sin nombre registrado'}</h1>
                  <span className="lp-usuarios-card-muted">
                    {ficha.roles.map((r) => ETIQUETAS_ROL[r]).join(', ')} ·{' '}
                    {ETIQUETAS_ESTADO_CUENTA[ficha.estadoCuenta] ?? ficha.estadoCuenta}
                  </span>
                </div>
              </div>
              <p className="lp-usuarios-card-texto">Correo: {ficha.correo}</p>
              <p className="lp-usuarios-card-texto">Teléfono: {ficha.telefono ?? '—'}</p>
              <p className="lp-usuarios-card-muted">Cuenta creada el {formatearFecha(ficha.creadoEn)}</p>

              {puedeActuar ? (
                ficha.estadoCuenta === 'bloqueada' ? (
                  <Button
                    variante="secondary"
                    style={{ width: 'auto', alignSelf: 'flex-start' }}
                    disabled={procesando}
                    onClick={onDesbloquear}
                    className="lp-usuarios-btn"
                  >
                    {procesando ? 'Desbloqueando…' : 'Desbloquear cuenta'}
                  </Button>
                ) : (
                  <Button
                    variante="secondary"
                    style={{ width: 'auto', alignSelf: 'flex-start' }}
                    disabled={procesando}
                    onClick={() => setMostrarMotivo((v) => !v)}
                    className="lp-usuarios-btn"
                  >
                    Bloquear cuenta
                  </Button>
                )
              ) : (
                <p className="lp-usuarios-card-muted">Solo ROOT puede bloquear una cuenta de administrador.</p>
              )}

              {mostrarMotivo ? (
                <form onSubmit={onBloquear} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Input
                    label="Motivo del bloqueo"
                    required
                    value={motivoBloqueo}
                    onChange={(e) => setMotivoBloqueo(e.target.value)}
                    disabled={procesando}
                  />
                  <Button type="submit" variante="secondary" disabled={procesando} style={{ width: 'auto', alignSelf: 'flex-start' }} className="lp-usuarios-btn">
                    {procesando ? 'Bloqueando…' : 'Confirmar bloqueo'}
                  </Button>
                </form>
              ) : null}
            </div>

            {ficha.paciente ? (
              <div className="lp-usuarios-card">
                <h2 className="lp-usuarios-card-titulo">Datos de paciente</h2>
                <p className="lp-usuarios-card-texto">Dirección: {ficha.paciente.direccion ?? '—'}</p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <MiniaturaDoc etiqueta="Cédula (frente)" url={ficha.paciente.cedulaFrenteUrl} />
                  <MiniaturaDoc etiqueta="Cédula (reverso)" url={ficha.paciente.cedulaReversoUrl} />
                </div>
              </div>
            ) : null}

            {ficha.domiciliario ? (
              <div className="lp-usuarios-card">
                <h2 className="lp-usuarios-card-titulo">Datos de domiciliario</h2>
                <p className="lp-usuarios-card-texto">Dirección: {ficha.domiciliario.direccion ?? '—'}</p>
                <p className="lp-usuarios-card-texto">Vehículo: {ficha.domiciliario.vehiculoTipo ?? '—'} · Placa {ficha.domiciliario.vehiculoPlaca ?? '—'}</p>
                <p className="lp-usuarios-card-texto">Disponibilidad: {ficha.domiciliario.disponible ? 'Disponible' : 'No disponible'}</p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
    </div>
  );
}