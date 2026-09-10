import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Input } from '../../../shared/components/Input';
import { SettingsIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  actualizarConfiguracionAdmin,
  actualizarNivelCopago,
  crearNivelCopago,
  eliminarNivelCopago,
  listarNivelesCopago,
  obtenerConfiguracionAdmin,
  type ConfiguracionAdmin,
  type NivelCopago,
} from '../api/configuracionAdminApi';
import './ConfiguracionTab.css';

/** Etiquetas + orden de los campos del formulario de tarifas — un solo
 * lugar para no repetir el mismo objeto 8 veces. */
const CAMPOS_PRECIO: {
  key: keyof ConfiguracionAdmin;
  label: string;
  sufijo: string;
  min: number;
}[] = [
  { key: 'umbralDemoraAsignacionMinutos', label: 'Umbral de demora (alarma "sin domiciliario")', sufijo: 'min', min: 1 },
  { key: 'tarifaBaseDomicilio', label: 'Tarifa base del domicilio', sufijo: '$', min: 0 },
  { key: 'tarifaPorKm', label: 'Tarifa por km', sufijo: '$/km', min: 0 },
  { key: 'tarifaPorMinuto', label: 'Tarifa por minuto', sufijo: '$/min', min: 0 },
  { key: 'tiempoBaseFarmaciaMin', label: 'Tiempo base en la farmacia', sufijo: 'min', min: 0 },
  { key: 'velocidadPromedioKmh', label: 'Velocidad promedio', sufijo: 'km/h', min: 0.1 },
  { key: 'distanciaIncluidaKm', label: 'Distancia incluida (sin excedente)', sufijo: 'km', min: 0 },
  { key: 'tarifaPorKmExcedente', label: 'Tarifa por km excedente', sufijo: '$/km', min: 0 },
];

/** Panel admin — parámetros del precio del pedido (copago + domicilio,
 * ver `CalcularPrecioPedidoUseCase` de la API): las 7 tarifas del
 * domicilio (+ el umbral de demora, que vive en la misma fila
 * singleton) y el catálogo de niveles de copago. El copago real de EPS
 * es un % de una tarifa privada EPS-IPS que no tenemos forma de
 * conocer — este es un catálogo propio de MediRuta, valor fijo en COP
 * por nivel, que el Paciente autodeclara en su perfil. */
export function ConfiguracionTab() {
  const { estado } = useAuth();

  const [config, setConfig] = useState<ConfiguracionAdmin | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [configGuardada, setConfigGuardada] = useState(false);

  const [niveles, setNiveles] = useState<NivelCopago[] | null>(null);
  const [errorNiveles, setErrorNiveles] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorCarga(null);
    Promise.all([
      obtenerConfiguracionAdmin(estado.accessToken),
      listarNivelesCopago(estado.accessToken),
    ])
      .then(([c, n]) => {
        setConfig(c);
        setNiveles(n);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorCarga(err.message);
        } else {
          throw err;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config === null) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  async function onGuardarConfig(evento: FormEvent) {
    evento.preventDefault();
    if (config === null) return;
    setGuardandoConfig(true);
    setErrorConfig(null);
    setConfigGuardada(false);
    try {
      await actualizarConfiguracionAdmin(accessToken, config);
      setConfigGuardada(true);
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setErrorConfig(err.message);
      } else {
        throw err;
      }
    } finally {
      setGuardandoConfig(false);
    }
  }

  function onCambiarCampo(key: keyof ConfiguracionAdmin, valor: string) {
    if (config === null) return;
    const numero = Number(valor);
    setConfig({ ...config, [key]: Number.isNaN(numero) ? 0 : numero });
  }

  return (
    <div className="lp-config-page">
      {errorCarga ? <Alert tono="error">{errorCarga}</Alert> : null}

      <form onSubmit={onGuardarConfig} className="lp-config-card">
        <h2 className="lp-config-card-titulo">
          <SettingsIcon /> Precio del domicilio y umbral de demora
        </h2>
        <p className="lp-config-card-ayuda">
          El precio total de cada pedido es el copago del nivel elegido por el Paciente + el costo de
          domicilio, calculado con estos parámetros.
        </p>

        {errorConfig ? <Alert tono="error">{errorConfig}</Alert> : null}
        {configGuardada ? <Alert tono="exito">Configuración actualizada.</Alert> : null}

        <div className="lp-config-grid-campos">
          {CAMPOS_PRECIO.map((campo) => (
            <Input
              key={campo.key}
              label={`${campo.label} (${campo.sufijo})`}
              type="number"
              min={campo.min}
              step="any"
              required
              value={config ? String(config[campo.key]) : ''}
              onChange={(e) => onCambiarCampo(campo.key, e.target.value)}
              disabled={config === null || guardandoConfig}
            />
          ))}
        </div>

        <button
          type="submit"
          className="lp-config-btn lp-config-btn-primary"
          disabled={config === null || guardandoConfig}
        >
          {guardandoConfig ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </form>

      <NivelesCopagoCard
        accessToken={accessToken}
        niveles={niveles}
        errorNiveles={errorNiveles}
        onError={setErrorNiveles}
        onRecargar={cargar}
      />
    </div>
  );
}

function NivelesCopagoCard({
  accessToken,
  niveles,
  errorNiveles,
  onError,
  onRecargar,
}: {
  accessToken: string;
  niveles: NivelCopago[] | null;
  errorNiveles: string | null;
  onError: (mensaje: string | null) => void;
  onRecargar: () => void;
}) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCopago, setNuevoCopago] = useState('');
  const [creando, setCreando] = useState(false);

  async function onCrear(evento: FormEvent) {
    evento.preventDefault();
    const copago = Number(nuevoCopago);
    if (!nuevoNombre.trim() || Number.isNaN(copago) || copago < 0) {
      onError('Completá el nombre y un copago válido (≥ 0).');
      return;
    }
    setCreando(true);
    onError(null);
    try {
      const orden = niveles ? niveles.length + 1 : 0;
      await crearNivelCopago(accessToken, { nombre: nuevoNombre.trim(), copago, orden });
      setNuevoNombre('');
      setNuevoCopago('');
      onRecargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        onError(err.message);
      } else {
        throw err;
      }
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="lp-config-card">
      <h2 className="lp-config-card-titulo">
        <SettingsIcon /> Niveles de copago
      </h2>
      <p className="lp-config-card-ayuda">
        Catálogo propio de MediRuta (no el copago real de EPS) — el Paciente elige uno de estos en su
        perfil.
      </p>

      {errorNiveles ? <Alert tono="error">{errorNiveles}</Alert> : null}

      {niveles === null ? (
        <p className="lp-config-cargando">Cargando…</p>
      ) : (
        <table className="lp-config-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Copago</th>
              <th>Orden</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {niveles.map((nivel) => (
              <FilaNivel
                key={nivel.id}
                accessToken={accessToken}
                nivel={nivel}
                onError={onError}
                onRecargar={onRecargar}
              />
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={onCrear} className="lp-config-nuevo-nivel">
        <Input
          label="Nombre del nuevo nivel"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          disabled={creando}
        />
        <Input
          label="Copago ($)"
          type="number"
          min={0}
          step="any"
          value={nuevoCopago}
          onChange={(e) => setNuevoCopago(e.target.value)}
          disabled={creando}
        />
        <button type="submit" className="lp-config-btn lp-config-btn-primary" disabled={creando}>
          {creando ? 'Agregando…' : 'Agregar nivel'}
        </button>
      </form>
    </div>
  );
}

function FilaNivel({
  accessToken,
  nivel,
  onError,
  onRecargar,
}: {
  accessToken: string;
  nivel: NivelCopago;
  onError: (mensaje: string | null) => void;
  onRecargar: () => void;
}) {
  const [nombre, setNombre] = useState(nivel.nombre);
  const [copago, setCopago] = useState(String(nivel.copago));
  const [orden, setOrden] = useState(String(nivel.orden));
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const modificado = nombre !== nivel.nombre || copago !== String(nivel.copago) || orden !== String(nivel.orden);

  async function onGuardar() {
    const copagoNum = Number(copago);
    const ordenNum = Number(orden);
    if (!nombre.trim() || Number.isNaN(copagoNum) || copagoNum < 0 || Number.isNaN(ordenNum)) {
      onError('Completá el nombre, un copago válido (≥ 0) y un orden numérico.');
      return;
    }
    setGuardando(true);
    onError(null);
    try {
      await actualizarNivelCopago(accessToken, nivel.id, {
        nombre: nombre.trim(),
        copago: copagoNum,
        orden: ordenNum,
      });
      onRecargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        onError(err.message);
      } else {
        throw err;
      }
    } finally {
      setGuardando(false);
    }
  }

  async function onEliminar() {
    if (!window.confirm(`¿Eliminar el nivel "${nivel.nombre}"? Solo se puede si ningún paciente lo tiene elegido.`)) {
      return;
    }
    setEliminando(true);
    onError(null);
    try {
      await eliminarNivelCopago(accessToken, nivel.id);
      onRecargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        onError(err.message);
      } else {
        throw err;
      }
    } finally {
      setEliminando(false);
    }
  }

  return (
    <tr>
      <td>
        <input
          className="lp-config-tabla-input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={guardando || eliminando}
        />
      </td>
      <td>
        <input
          className="lp-config-tabla-input"
          type="number"
          min={0}
          step="any"
          value={copago}
          onChange={(e) => setCopago(e.target.value)}
          disabled={guardando || eliminando}
        />
      </td>
      <td>
        <input
          className="lp-config-tabla-input lp-config-tabla-input-orden"
          type="number"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          disabled={guardando || eliminando}
        />
      </td>
      <td className="lp-config-tabla-acciones">
        {modificado ? (
          <button
            type="button"
            className="lp-config-btn lp-config-btn-primary lp-config-btn-mini"
            onClick={onGuardar}
            disabled={guardando || eliminando}
          >
            {guardando ? '…' : 'Guardar'}
          </button>
        ) : null}
        <button
          type="button"
          className="lp-config-btn lp-config-btn-peligro lp-config-btn-mini"
          onClick={onEliminar}
          disabled={guardando || eliminando}
        >
          {eliminando ? '…' : 'Eliminar'}
        </button>
      </td>
    </tr>
  );
}
