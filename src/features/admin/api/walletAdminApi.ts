import { apiClient } from '../../../shared/lib/apiClient';

/** Módulo 3 — billetera de un Domiciliario tal como la ve el admin.
 * `saldoPendienteCobrar` es plata que la EMPRESA le debe (tarjeta/
 * transferencia ya cobrados por la empresa, pendientes de pagarle);
 * `saldoCobrado` es lo que el domiciliario ya tiene en mano (efectivo
 * neto + lo que ya se le liquidó); `deudaEfectivo` es lo que él le
 * debe a la empresa. */
export type WalletAdmin = {
  domiciliarioId: string;
  correo: string;
  comisionAcumulada: number;
  saldoCobrado: number;
  saldoPendienteCobrar: number;
  deudaEfectivo: number;
  bloqueadoPorTope: boolean;
};

export type TipoLiquidacion = 'deuda_efectivo' | 'saldo_pendiente';

export type ResultadoLiquidacionLote = {
  domiciliarioId: string;
  montoLiquidado: number;
  resultado: 'liquidado' | 'sin_deuda' | 'sin_saldo' | 'no_encontrado';
};

/** Informe global tipo "Z" — snapshot de lo pendiente (por pagar/por
 * cobrar) + lo saldado en el periodo elegido. */
export type InformePagosAdmin = {
  totalPorPagar: number;
  totalPorCobrar: number;
  totalLiquidadoPagosPeriodo: number;
  totalLiquidadoDeudasPeriodo: number;
  /** Comisión que se queda MediRuta de los domicilios entregados en el
   * periodo — no es plata de ningún domiciliario, es ingreso propio. */
  totalIngresosEmpresaPeriodo: number;
  domiciliariosBloqueados: number;
  domiciliariosConSaldoPendiente: number;
};

type MensajeResultado = { message: string };

export function listarWalletsAdmin(accessToken: string) {
  return apiClient.get('/admin/wallets', { accessToken }) as Promise<WalletAdmin[]>;
}

/** Columna "Pagado en el periodo" de la tabla de billeteras — cuánto se
 * le liquidó de saldo pendiente a cada domiciliario dentro del rango,
 * que es justo lo que incrementó su `saldoCobrado` en ese periodo. */
export function obtenerPagadoPeriodoAdmin(accessToken: string, desde: string, hasta: string) {
  return apiClient.get(`/admin/wallets/pagado-periodo?desde=${desde}&hasta=${hasta}`, {
    accessToken,
  }) as Promise<Record<string, number>>;
}

export function obtenerInformePagosAdmin(accessToken: string, desde: string, hasta: string) {
  return apiClient.get(`/admin/wallets/informe?desde=${desde}&hasta=${hasta}`, {
    accessToken,
  }) as Promise<InformePagosAdmin>;
}

/** CA3 — el admin confirma que el Domiciliario consignó/entregó la
 * deuda: vuelve a $0 y se desbloquea para aceptar pedidos de nuevo. */
export function liquidarDeudaDomiciliario(accessToken: string, domiciliarioId: string) {
  return apiClient.post(`/admin/wallets/${domiciliarioId}/liquidar-deuda`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** La empresa le paga al domiciliario el saldo pendiente de tarjeta/transferencia. */
export function liquidarSaldoDomiciliario(accessToken: string, domiciliarioId: string) {
  return apiClient.post(`/admin/wallets/${domiciliarioId}/liquidar-saldo`, undefined, {
    accessToken,
  }) as Promise<MensajeResultado>;
}

/** Deuda o saldo, para varios domiciliarios de una. */
export function liquidarLoteAdmin(
  accessToken: string,
  tipo: TipoLiquidacion,
  domiciliarioIds: string[],
) {
  return apiClient.post(
    '/admin/wallets/liquidar-lote',
    { tipo, domiciliarioIds },
    { accessToken },
  ) as Promise<ResultadoLiquidacionLote[]>;
}
