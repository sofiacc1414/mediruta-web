import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { Input } from '../../../shared/components/Input';
import { StoreIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  actualizarFarmaciaAliada,
  crearFarmaciaAliada,
  eliminarFarmaciaAliada,
  listarFarmaciasAliadas,
  type FarmaciaAliada,
  type FarmaciaAliadaInput,
} from '../api/farmaciasAliadasAdminApi';
import './FarmaciasAliadasTab.css';

const FORMULARIO_VACIO: FarmaciaAliadaInput = {
  eps: '',
  nombreFarmacia: '',
  ciudad: '',
  departamento: '',
  direccion: '',
  telefono: '',
  activo: true,
};

/** Panel admin — Módulo 2 (Chatbot): qué farmacia dispensa para cada
 * EPS cambia seguido en la vida real (una EPS puede cambiar de gestor
 * farmacéutico de un mes a otro), por eso es un catálogo editable acá
 * en vez de una lista fija en código — el chatbot responde "¿cuáles
 * son las farmacias de mi EPS?" con lo que haya cargado acá. */
export function FarmaciasAliadasTab() {
  const { estado } = useAuth();

  const [farmacias, setFarmacias] = useState<FarmaciaAliada[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    listarFarmaciasAliadas(estado.accessToken)
      .then(setFarmacias)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (farmacias === null) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  return (
    <div className="lp-farmacias-page">
      <div className="lp-farmacias-card">
        <h2 className="lp-farmacias-card-titulo">
          <StoreIcon /> Farmacias aliadas por EPS
        </h2>
        <p className="lp-farmacias-card-ayuda">
          El chatbot usa este catálogo para responder "¿cuáles son las farmacias de mi EPS?".
          Mantenelo al día — qué farmacia dispensa para cada EPS cambia seguido.
        </p>

        {error ? <Alert tono="error">{error}</Alert> : null}

        {farmacias === null ? (
          <p className="lp-farmacias-cargando">Cargando…</p>
        ) : (
          <table className="lp-farmacias-tabla">
            <thead>
              <tr>
                <th>EPS</th>
                <th>Farmacia</th>
                <th>Ciudad</th>
                <th>Departamento</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Activa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {farmacias.map((farmacia) => (
                <FilaFarmacia
                  key={farmacia.id}
                  accessToken={accessToken}
                  farmacia={farmacia}
                  onError={setError}
                  onRecargar={cargar}
                />
              ))}
            </tbody>
          </table>
        )}

        <NuevaFarmaciaForm accessToken={accessToken} onError={setError} onRecargar={cargar} />
      </div>
    </div>
  );
}

function NuevaFarmaciaForm({
  accessToken,
  onError,
  onRecargar,
}: {
  accessToken: string;
  onError: (mensaje: string | null) => void;
  onRecargar: () => void;
}) {
  const [form, setForm] = useState<FarmaciaAliadaInput>(FORMULARIO_VACIO);
  const [creando, setCreando] = useState(false);

  async function onCrear(evento: FormEvent) {
    evento.preventDefault();
    if (!form.eps.trim() || !form.nombreFarmacia.trim() || !form.ciudad.trim()) {
      onError('Completá al menos la EPS, el nombre de la farmacia y la ciudad.');
      return;
    }
    setCreando(true);
    onError(null);
    try {
      await crearFarmaciaAliada(accessToken, form);
      setForm(FORMULARIO_VACIO);
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
    <form onSubmit={onCrear} className="lp-farmacias-nueva">
      <Input
        label="EPS"
        value={form.eps}
        onChange={(e) => setForm({ ...form, eps: e.target.value })}
        disabled={creando}
      />
      <Input
        label="Nombre de la farmacia"
        value={form.nombreFarmacia}
        onChange={(e) => setForm({ ...form, nombreFarmacia: e.target.value })}
        disabled={creando}
      />
      <Input
        label="Ciudad"
        value={form.ciudad}
        onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
        disabled={creando}
      />
      <Input
        label="Departamento (opcional)"
        value={form.departamento}
        onChange={(e) => setForm({ ...form, departamento: e.target.value })}
        disabled={creando}
      />
      <Input
        label="Dirección (opcional)"
        value={form.direccion}
        onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        disabled={creando}
      />
      <Input
        label="Teléfono (opcional)"
        value={form.telefono}
        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        disabled={creando}
      />
      <button
        type="submit"
        className="lp-farmacias-btn lp-farmacias-btn-primary lp-farmacias-nueva-btn"
        disabled={creando}
      >
        {creando ? 'Agregando…' : 'Agregar farmacia'}
      </button>
    </form>
  );
}

function FilaFarmacia({
  accessToken,
  farmacia,
  onError,
  onRecargar,
}: {
  accessToken: string;
  farmacia: FarmaciaAliada;
  onError: (mensaje: string | null) => void;
  onRecargar: () => void;
}) {
  const [eps, setEps] = useState(farmacia.eps);
  const [nombreFarmacia, setNombreFarmacia] = useState(farmacia.nombreFarmacia);
  const [ciudad, setCiudad] = useState(farmacia.ciudad);
  const [departamento, setDepartamento] = useState(farmacia.departamento ?? '');
  const [direccion, setDireccion] = useState(farmacia.direccion ?? '');
  const [telefono, setTelefono] = useState(farmacia.telefono ?? '');
  const [activo, setActivo] = useState(farmacia.activo);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const modificado =
    eps !== farmacia.eps ||
    nombreFarmacia !== farmacia.nombreFarmacia ||
    ciudad !== farmacia.ciudad ||
    departamento !== (farmacia.departamento ?? '') ||
    direccion !== (farmacia.direccion ?? '') ||
    telefono !== (farmacia.telefono ?? '') ||
    activo !== farmacia.activo;

  async function onGuardar() {
    if (!eps.trim() || !nombreFarmacia.trim() || !ciudad.trim()) {
      onError('Completá al menos la EPS, el nombre de la farmacia y la ciudad.');
      return;
    }
    setGuardando(true);
    onError(null);
    try {
      await actualizarFarmaciaAliada(accessToken, farmacia.id, {
        eps: eps.trim(),
        nombreFarmacia: nombreFarmacia.trim(),
        ciudad: ciudad.trim(),
        departamento,
        direccion,
        telefono,
        activo,
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
    if (!window.confirm(`¿Eliminar "${farmacia.nombreFarmacia}" (${farmacia.eps})?`)) return;
    setEliminando(true);
    onError(null);
    try {
      await eliminarFarmaciaAliada(accessToken, farmacia.id);
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

  const deshabilitado = guardando || eliminando;

  return (
    <tr className={activo ? undefined : 'lp-farmacias-tabla-inactiva'}>
      <td>
        <input
          className="lp-farmacias-tabla-input"
          value={eps}
          onChange={(e) => setEps(e.target.value)}
          disabled={deshabilitado}
        />
      </td>
      <td>
        <input
          className="lp-farmacias-tabla-input"
          value={nombreFarmacia}
          onChange={(e) => setNombreFarmacia(e.target.value)}
          disabled={deshabilitado}
        />
      </td>
      <td>
        <input
          className="lp-farmacias-tabla-input"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          disabled={deshabilitado}
        />
      </td>
      <td>
        <input
          className="lp-farmacias-tabla-input"
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          disabled={deshabilitado}
        />
      </td>
      <td>
        <input
          className="lp-farmacias-tabla-input"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          disabled={deshabilitado}
        />
      </td>
      <td>
        <input
          className="lp-farmacias-tabla-input"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          disabled={deshabilitado}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          disabled={deshabilitado}
        />
      </td>
      <td className="lp-farmacias-tabla-acciones">
        {modificado ? (
          <button
            type="button"
            className="lp-farmacias-btn lp-farmacias-btn-primary lp-farmacias-btn-mini"
            onClick={onGuardar}
            disabled={deshabilitado}
          >
            {guardando ? '…' : 'Guardar'}
          </button>
        ) : null}
        <button
          type="button"
          className="lp-farmacias-btn lp-farmacias-btn-peligro lp-farmacias-btn-mini"
          onClick={onEliminar}
          disabled={deshabilitado}
        >
          {eliminando ? '…' : 'Eliminar'}
        </button>
      </td>
    </tr>
  );
}
