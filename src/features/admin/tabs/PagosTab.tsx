import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../shared/components/Alert';
import { WalletIcon } from '../../../shared/components/icons';
import { ApiError, ApiSinConexionError } from '../../../shared/lib/apiError';
import { useAuth } from '../../usuarios/hooks/useAuth';
import {
  liquidarDeudaDomiciliario,
  liquidarLoteAdmin,
  liquidarSaldoDomiciliario,
  listarWalletsAdmin,
  obtenerInformePagosAdmin,
  obtenerPagadoPeriodoAdmin,
  type InformePagosAdmin,
  type TipoLiquidacion,
  type WalletAdmin,
} from '../api/walletAdminApi';
import './PagosTab.css';

function formatearMoneda(valor: number): string {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function primerDiaDelMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Módulo 3 — informe global de pagos + la billetera de cada
 * Domiciliario con liquidación individual o en lote. La transferencia
 * ya se aprueba sola vía pasarela simulada (igual que tarjeta) al
 * enviar el pedido — no queda nada que revisar a mano acá. */
export function PagosTab() {
  const { estado } = useAuth();

  const [wallets, setWallets] = useState<WalletAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoyIso());
  const [informe, setInforme] = useState<InformePagosAdmin | null>(null);
  const [errorInforme, setErrorInforme] = useState<string | null>(null);
  const [pagadoPeriodo, setPagadoPeriodo] = useState<Record<string, number>>({});

  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [liquidandoLote, setLiquidandoLote] = useState(false);
  const [mensajeLote, setMensajeLote] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setError(null);
    listarWalletsAdmin(estado.accessToken)
      .then(setWallets)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setError(err.message);
        } else {
          throw err;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarInforme = useCallback(() => {
    if (estado.tipo !== 'autenticado') return;
    setErrorInforme(null);
    obtenerInformePagosAdmin(estado.accessToken, desde, hasta)
      .then(setInforme)
      .catch((err: unknown) => {
        if (err instanceof ApiError || err instanceof ApiSinConexionError) {
          setErrorInforme(err.message);
        } else {
          throw err;
        }
      });
    obtenerPagadoPeriodoAdmin(estado.accessToken, desde, hasta)
      .then(setPagadoPeriodo)
      .catch(() => setPagadoPeriodo({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  useEffect(() => {
    if (wallets === null) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarInforme();
  }, [cargarInforme]);

  if (estado.tipo !== 'autenticado') return null;
  const accessToken = estado.accessToken;

  function onToggleSeleccion(domiciliarioId: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(domiciliarioId)) next.delete(domiciliarioId);
      else next.add(domiciliarioId);
      return next;
    });
  }

  async function onLiquidarLote(tipo: TipoLiquidacion) {
    if (seleccionados.size === 0) return;
    const etiqueta = tipo === 'deuda_efectivo' ? 'deuda de efectivo' : 'saldo pendiente';
    if (!window.confirm(`¿Liquidar ${etiqueta} de ${seleccionados.size} domiciliario(s) seleccionados?`)) {
      return;
    }
    setLiquidandoLote(true);
    setMensajeLote(null);
    try {
      const resultados = await liquidarLoteAdmin(accessToken, tipo, Array.from(seleccionados));
      const liquidados = resultados.filter((r) => r.resultado === 'liquidado').length;
      setMensajeLote(`Se liquidaron ${liquidados} de ${resultados.length} seleccionados.`);
      setSeleccionados(new Set());
      cargar();
      cargarInforme();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setMensajeLote(err.message);
      } else {
        throw err;
      }
    } finally {
      setLiquidandoLote(false);
    }
  }

  return (
    <div className="lp-pagos-page">
      {error ? <Alert tono="error">{error}</Alert> : null}

      <div className="lp-pagos-card">
        <h2 className="lp-pagos-card-titulo">
          <WalletIcon /> Informe de pagos
        </h2>
        <p className="lp-pagos-card-ayuda">
          Lo pendiente (por pagar/por cobrar) es a hoy; lo saldado es solo dentro del rango elegido.
        </p>

        <div className="lp-pagos-rango-fechas">
          <label>
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>

        {errorInforme ? <Alert tono="error">{errorInforme}</Alert> : null}

        {informe === null ? (
          <p className="lp-pagos-cargando">Cargando…</p>
        ) : (
          <div className="lp-pagos-informe-grid">
            <div className="lp-pagos-informe-celda lp-pagos-informe-pagar">
              <span className="lp-pagos-informe-etiqueta">Por pagar (hoy)</span>
              <span className="lp-pagos-informe-monto">{formatearMoneda(informe.totalPorPagar)}</span>
              <span className="lp-pagos-informe-detalle">
                {informe.domiciliariosConSaldoPendiente} domiciliario(s) con saldo pendiente
              </span>
            </div>
            <div className="lp-pagos-informe-celda lp-pagos-informe-cobrar">
              <span className="lp-pagos-informe-etiqueta">Por cobrar (hoy)</span>
              <span className="lp-pagos-informe-monto">{formatearMoneda(informe.totalPorCobrar)}</span>
              <span className="lp-pagos-informe-detalle">
                {informe.domiciliariosBloqueados} domiciliario(s) bloqueados
              </span>
            </div>
            <div className="lp-pagos-informe-celda lp-pagos-informe-cobrar">
              <span className="lp-pagos-informe-etiqueta">Ingresos de la empresa (periodo)</span>
              <span className="lp-pagos-informe-monto">
                {formatearMoneda(informe.totalIngresosEmpresaPeriodo)}
              </span>
              <span className="lp-pagos-informe-detalle">
                Comisión de MediRuta sobre domicilios entregados
              </span>
            </div>
            <div className="lp-pagos-informe-celda lp-pagos-informe-pagar">
              <span className="lp-pagos-informe-etiqueta">Pagado en el periodo</span>
              <span className="lp-pagos-informe-monto">
                -{formatearMoneda(informe.totalLiquidadoPagosPeriodo)}
              </span>
              <span className="lp-pagos-informe-detalle">
                Liquidado a domiciliarios (saldo pendiente)
              </span>
            </div>
            <div className="lp-pagos-informe-celda lp-pagos-informe-saldado">
              <span className="lp-pagos-informe-etiqueta">Neto saldado en el periodo</span>
              <span className="lp-pagos-informe-monto">
                {formatearMoneda(informe.totalLiquidadoDeudasPeriodo - informe.totalLiquidadoPagosPeriodo)}
              </span>
              <span className="lp-pagos-informe-detalle">
                -{formatearMoneda(informe.totalLiquidadoPagosPeriodo)} pagado · +{formatearMoneda(informe.totalLiquidadoDeudasPeriodo)} cobrado
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="lp-pagos-card">
        <h2 className="lp-pagos-card-titulo">
          <WalletIcon /> Billeteras de los domiciliarios
        </h2>
        <p className="lp-pagos-card-ayuda">
          "Saldo pendiente" es tarjeta/transferencia que la empresa ya cobró y todavía no le pagó al
          domiciliario. "Deuda" es efectivo que el domiciliario cobró y todavía no entregó. Un domiciliario
          bloqueado no puede aceptar pedidos nuevos hasta que se liquide su deuda.
        </p>

        {seleccionados.size > 0 ? (
          <div className="lp-pagos-barra-lote">
            <span>{seleccionados.size} seleccionado(s)</span>
            <button
              type="button"
              className="lp-pagos-btn lp-pagos-btn-primario lp-pagos-btn-mini"
              onClick={() => onLiquidarLote('saldo_pendiente')}
              disabled={liquidandoLote}
            >
              Liquidar saldo pendiente
            </button>
            <button
              type="button"
              className="lp-pagos-btn lp-pagos-btn-primario lp-pagos-btn-mini"
              onClick={() => onLiquidarLote('deuda_efectivo')}
              disabled={liquidandoLote}
            >
              Liquidar deuda efectivo
            </button>
          </div>
        ) : null}
        {mensajeLote ? <Alert tono="exito">{mensajeLote}</Alert> : null}

        {wallets === null ? (
          <p className="lp-pagos-cargando">Cargando…</p>
        ) : wallets.length === 0 ? (
          <p className="lp-pagos-cargando">Ningún domiciliario tiene billetera todavía (no han entregado pedidos).</p>
        ) : (
          <table className="lp-pagos-tabla">
            <thead>
              <tr>
                <th />
                <th>Domiciliario</th>
                <th>Saldo cobrado</th>
                <th>Pagado en el periodo</th>
                <th>Saldo pendiente</th>
                <th>Deuda de efectivo</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <FilaWallet
                  key={wallet.domiciliarioId}
                  accessToken={accessToken}
                  wallet={wallet}
                  pagadoEnPeriodo={pagadoPeriodo[wallet.domiciliarioId] ?? 0}
                  seleccionado={seleccionados.has(wallet.domiciliarioId)}
                  onToggleSeleccion={() => onToggleSeleccion(wallet.domiciliarioId)}
                  onRecargar={() => {
                    cargar();
                    cargarInforme();
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FilaWallet({
  accessToken,
  wallet,
  pagadoEnPeriodo,
  seleccionado,
  onToggleSeleccion,
  onRecargar,
}: {
  accessToken: string;
  wallet: WalletAdmin;
  pagadoEnPeriodo: number;
  seleccionado: boolean;
  onToggleSeleccion: () => void;
  onRecargar: () => void;
}) {
  const [liquidando, setLiquidando] = useState<'deuda' | 'saldo' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onLiquidarDeuda() {
    if (!window.confirm(`¿Confirmar que ${wallet.correo} entregó/consignó ${formatearMoneda(wallet.deudaEfectivo)}?`)) {
      return;
    }
    setLiquidando('deuda');
    setError(null);
    try {
      await liquidarDeudaDomiciliario(accessToken, wallet.domiciliarioId);
      onRecargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setLiquidando(null);
    }
  }

  async function onLiquidarSaldo() {
    if (!window.confirm(`¿Confirmar que le pagaste a ${wallet.correo} ${formatearMoneda(wallet.saldoPendienteCobrar)}?`)) {
      return;
    }
    setLiquidando('saldo');
    setError(null);
    try {
      await liquidarSaldoDomiciliario(accessToken, wallet.domiciliarioId);
      onRecargar();
    } catch (err) {
      if (err instanceof ApiError || err instanceof ApiSinConexionError) {
        setError(err.message);
      } else {
        throw err;
      }
    } finally {
      setLiquidando(null);
    }
  }

  return (
    <tr>
      <td>
        <input type="checkbox" checked={seleccionado} onChange={onToggleSeleccion} />
      </td>
      <td>{wallet.correo}</td>
      <td>{formatearMoneda(wallet.saldoCobrado)}</td>
      <td>{formatearMoneda(pagadoEnPeriodo)}</td>
      <td>{formatearMoneda(wallet.saldoPendienteCobrar)}</td>
      <td>{formatearMoneda(wallet.deudaEfectivo)}</td>
      <td>
        {wallet.bloqueadoPorTope ? (
          <span className="lp-pagos-badge lp-pagos-badge-bloqueado">Bloqueado</span>
        ) : (
          <span className="lp-pagos-badge lp-pagos-badge-ok">Activo</span>
        )}
      </td>
      <td className="lp-pagos-tabla-acciones">
        {error ? <Alert tono="error">{error}</Alert> : null}
        {wallet.deudaEfectivo > 0 ? (
          <button
            type="button"
            className="lp-pagos-btn lp-pagos-btn-primario lp-pagos-btn-mini"
            onClick={onLiquidarDeuda}
            disabled={liquidando !== null}
          >
            {liquidando === 'deuda' ? '…' : 'Liquidar deuda'}
          </button>
        ) : null}
        {wallet.saldoPendienteCobrar > 0 ? (
          <button
            type="button"
            className="lp-pagos-btn lp-pagos-btn-secundario lp-pagos-btn-mini"
            onClick={onLiquidarSaldo}
            disabled={liquidando !== null}
          >
            {liquidando === 'saldo' ? '…' : 'Pagar saldo'}
          </button>
        ) : null}
      </td>
    </tr>
  );
}
