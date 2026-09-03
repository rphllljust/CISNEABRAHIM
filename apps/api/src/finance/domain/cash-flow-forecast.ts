import {
  isPositiveMoneyAmount,
  moneyAmountsEqual,
  normalizeMoneyAmount,
  subtractMoneyAmounts,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';
import {
  PAYABLE_LIFECYCLES,
  installmentRemaining,
  remainingBalance as payableRemainingBalance,
  type PostedPayment,
} from './payable';
import {
  RECEIVABLE_LIFECYCLES,
  postedSettlementAmounts,
  remainingBalance as receivableRemainingBalance,
  type PostedSettlement,
} from './receivable';
import { FINANCIAL_TRANSACTION_STATUSES, derivedBalance, type PostedTreasuryMovement } from './treasury';

export const CASH_FLOW_KINDS = {
  Realized: 'REALIZED',
  Forecast: 'FORECAST',
} as const;

export const CASH_FORECAST_STATUSES = {
  Projected: 'PROJECTED',
  NoData: 'NO_DATA',
} as const;

export const CASH_FORECAST_SOURCES = {
  TreasuryBalance: 'TREASURY_BALANCE',
  ReceivableSettlement: 'RECEIVABLE_SETTLEMENT',
  PayablePayment: 'PAYABLE_PAYMENT',
  ReceivableInstallment: 'RECEIVABLE_INSTALLMENT',
  PayableInstallment: 'PAYABLE_INSTALLMENT',
} as const;

export const CASH_FORECAST_BUCKETS = {
  Overdue: 'OVERDUE',
  Due: 'DUE',
  Scheduled: 'SCHEDULED',
} as const;

export class CashForecastError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const ISO_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

export function asCashForecastIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const match = ISO_DATE_PATTERN.exec(String(value).trim());
  if (!match) {
    throw new CashForecastError('CASH_FORECAST_INVALID');
  }
  return match[1]!;
}

export type CashForecastLine = {
  kind: 'REALIZED' | 'FORECAST';
  source: (typeof CASH_FORECAST_SOURCES)[keyof typeof CASH_FORECAST_SOURCES];
  direction: 'INFLOW' | 'OUTFLOW' | 'BALANCE';
  amount: string;
  dueOn: string | null;
  bucket: 'OVERDUE' | 'DUE' | 'SCHEDULED' | null;
  originId: string;
};

const FORECAST_ONLY_SOURCES = new Set<string>([
  CASH_FORECAST_SOURCES.ReceivableInstallment,
  CASH_FORECAST_SOURCES.PayableInstallment,
]);

const REALIZED_ONLY_SOURCES = new Set<string>([
  CASH_FORECAST_SOURCES.TreasuryBalance,
  CASH_FORECAST_SOURCES.ReceivableSettlement,
  CASH_FORECAST_SOURCES.PayablePayment,
]);

export function classifyDueBucket(dueOn: string, asOf: string): 'OVERDUE' | 'DUE' | 'SCHEDULED' {
  const due = asCashForecastIsoDate(dueOn);
  const today = asCashForecastIsoDate(asOf);
  if (due < today) {
    return CASH_FORECAST_BUCKETS.Overdue;
  }
  if (due === today) {
    return CASH_FORECAST_BUCKETS.Due;
  }
  return CASH_FORECAST_BUCKETS.Scheduled;
}

export function includeForecastDueOn(dueOn: string, asOf: string, horizonEndsOn: string): boolean {
  const due = asCashForecastIsoDate(dueOn);
  const today = asCashForecastIsoDate(asOf);
  const horizon = asCashForecastIsoDate(horizonEndsOn);
  if (due < today) {
    return true;
  }
  return due <= horizon;
}

export function remainingReceivableInstallment(input: {
  installmentId: string;
  installmentPrincipal: string;
  siblingCount: number;
  settlements: Array<PostedSettlement & { receivableId?: string }>;
}): string {
  const assigned = input.settlements.filter((item) => item.installmentId === input.installmentId);
  const unassigned = input.siblingCount === 1 ? input.settlements.filter((item) => !item.installmentId) : [];
  return receivableRemainingBalance(input.installmentPrincipal, postedSettlementAmounts([...assigned, ...unassigned]));
}

export function countFalseRealizedValues(lines: CashForecastLine[]): number {
  return lines.filter((line) => {
    if (line.kind === CASH_FLOW_KINDS.Realized && FORECAST_ONLY_SOURCES.has(line.source)) {
      return true;
    }
    if (line.kind === CASH_FLOW_KINDS.Forecast && REALIZED_ONLY_SOURCES.has(line.source)) {
      return true;
    }
    if (line.source === CASH_FORECAST_SOURCES.ReceivableInstallment && line.kind !== CASH_FLOW_KINDS.Forecast) {
      return true;
    }
    if (line.source === CASH_FORECAST_SOURCES.PayableInstallment && line.kind !== CASH_FLOW_KINDS.Forecast) {
      return true;
    }
    return false;
  }).length;
}

export function assertNoFalseRealized(lines: CashForecastLine[]): void {
  if (countFalseRealizedValues(lines) !== 0) {
    throw new CashForecastError('CASH_FORECAST_FALSE_REALIZED');
  }
}

export function realizedTreasuryCash(movements: PostedTreasuryMovement[]): string {
  return derivedBalance(
    movements.filter((item) => item.status === FINANCIAL_TRANSACTION_STATUSES.Posted),
  );
}

export function normalizeForecastAmount(value: string): string {
  if (value.startsWith('-')) {
    return `-${normalizeMoneyAmount(value.slice(1) === '0' ? '0.0000' : value.slice(1))}`;
  }
  return normalizeMoneyAmount(value === '0' ? '0.0000' : value);
}

export type CashForecastDocument = {
  id: string;
  lifecycle: string;
  principal: string;
};

export type CashForecastInstallment = {
  id: string;
  documentId: string;
  principal: string;
  dueOn: string;
};

export function buildCashForecast(input: {
  asOf: string;
  horizonEndsOn: string;
  movements: PostedTreasuryMovement[];
  receivables: CashForecastDocument[];
  receivableInstallments: CashForecastInstallment[];
  settlements: Array<PostedSettlement & { receivableId: string; id: string }>;
  payables: CashForecastDocument[];
  payableInstallments: CashForecastInstallment[];
  payments: Array<PostedPayment & { payableId: string; id: string }>;
}): {
  status: 'PROJECTED' | 'NO_DATA';
  lines: CashForecastLine[];
  realizedCash: string;
  realizedInflows: string;
  realizedOutflows: string;
  forecastInflows: string;
  forecastOutflows: string;
  overdueInflows: string;
  overdueOutflows: string;
  projectedCash: string;
  reconciliation: {
    receivablePrincipal: string;
    receivableRealized: string;
    receivableForecast: string;
    payablePrincipal: string;
    payableRealized: string;
    payableForecast: string;
    horizonExcludedInflows: string;
    horizonExcludedOutflows: string;
    balanced: boolean;
  };
} {
  const asOf = asCashForecastIsoDate(input.asOf);
  const horizonEndsOn = asCashForecastIsoDate(input.horizonEndsOn);
  const hasData =
    input.movements.length > 0 ||
    input.receivables.length > 0 ||
    input.payables.length > 0;
  if (!hasData) {
    return {
      status: CASH_FORECAST_STATUSES.NoData,
      lines: [],
      realizedCash: normalizeForecastAmount('0'),
      realizedInflows: normalizeForecastAmount('0'),
      realizedOutflows: normalizeForecastAmount('0'),
      forecastInflows: normalizeForecastAmount('0'),
      forecastOutflows: normalizeForecastAmount('0'),
      overdueInflows: normalizeForecastAmount('0'),
      overdueOutflows: normalizeForecastAmount('0'),
      projectedCash: normalizeForecastAmount('0'),
      reconciliation: {
        receivablePrincipal: normalizeForecastAmount('0'),
        receivableRealized: normalizeForecastAmount('0'),
        receivableForecast: normalizeForecastAmount('0'),
        payablePrincipal: normalizeForecastAmount('0'),
        payableRealized: normalizeForecastAmount('0'),
        payableForecast: normalizeForecastAmount('0'),
        horizonExcludedInflows: normalizeForecastAmount('0'),
        horizonExcludedOutflows: normalizeForecastAmount('0'),
        balanced: true,
      },
    };
  }

  const lines: CashForecastLine[] = [];
  const realizedCash = normalizeForecastAmount(realizedTreasuryCash(input.movements));
  lines.push({
    kind: CASH_FLOW_KINDS.Realized,
    source: CASH_FORECAST_SOURCES.TreasuryBalance,
    direction: 'BALANCE',
    amount: realizedCash,
    dueOn: null,
    bucket: null,
    originId: 'treasury',
  });

  const activeReceivables = input.receivables.filter((item) => item.lifecycle === RECEIVABLE_LIFECYCLES.Active);
  const activePayables = input.payables.filter((item) => item.lifecycle === PAYABLE_LIFECYCLES.Active);

  let realizedInflows = '0';
  let excludedInflows = '0';
  let excludedOutflows = '0';
  for (const receivable of activeReceivables) {
    const posted = input.settlements.filter((item) => item.receivableId === receivable.id);
    const settled = sumMoneyAmounts(postedSettlementAmounts(posted));
    if (isPositiveMoneyAmount(settled)) {
      realizedInflows = sumMoneyAmounts([realizedInflows, settled]);
      lines.push({
        kind: CASH_FLOW_KINDS.Realized,
        source: CASH_FORECAST_SOURCES.ReceivableSettlement,
        direction: 'INFLOW',
        amount: normalizeForecastAmount(settled),
        dueOn: null,
        bucket: null,
        originId: receivable.id,
      });
    }
    const siblings = input.receivableInstallments.filter((item) => item.documentId === receivable.id);
    for (const installment of siblings) {
      const remaining = remainingReceivableInstallment({
        installmentId: installment.id,
        installmentPrincipal: installment.principal,
        siblingCount: siblings.length,
        settlements: posted,
      });
      if (!isPositiveMoneyAmount(remaining)) {
        continue;
      }
      if (!includeForecastDueOn(installment.dueOn, asOf, horizonEndsOn)) {
        excludedInflows = sumMoneyAmounts([excludedInflows, remaining]);
        continue;
      }
      lines.push({
        kind: CASH_FLOW_KINDS.Forecast,
        source: CASH_FORECAST_SOURCES.ReceivableInstallment,
        direction: 'INFLOW',
        amount: normalizeForecastAmount(remaining),
        dueOn: asCashForecastIsoDate(installment.dueOn),
        bucket: classifyDueBucket(installment.dueOn, asOf),
        originId: installment.id,
      });
    }
  }

  let realizedOutflows = '0';
  for (const payable of activePayables) {
    const payments = input.payments.filter((item) => item.payableId === payable.id);
    const netPaid = subtractMoneyAmounts(
      normalizeMoneyAmount(payable.principal),
      payableRemainingBalance(payable.principal, payments),
    );
    if (isPositiveMoneyAmount(netPaid)) {
      realizedOutflows = sumMoneyAmounts([realizedOutflows, netPaid]);
      lines.push({
        kind: CASH_FLOW_KINDS.Realized,
        source: CASH_FORECAST_SOURCES.PayablePayment,
        direction: 'OUTFLOW',
        amount: normalizeForecastAmount(netPaid),
        dueOn: null,
        bucket: null,
        originId: payable.id,
      });
    }
    const siblings = input.payableInstallments.filter((item) => item.documentId === payable.id);
    for (const installment of siblings) {
      const remaining = installmentRemaining(installment.principal, payments, installment.id);
      if (!isPositiveMoneyAmount(remaining)) {
        continue;
      }
      if (!includeForecastDueOn(installment.dueOn, asOf, horizonEndsOn)) {
        excludedOutflows = sumMoneyAmounts([excludedOutflows, remaining]);
        continue;
      }
      lines.push({
        kind: CASH_FLOW_KINDS.Forecast,
        source: CASH_FORECAST_SOURCES.PayableInstallment,
        direction: 'OUTFLOW',
        amount: normalizeForecastAmount(remaining),
        dueOn: asCashForecastIsoDate(installment.dueOn),
        bucket: classifyDueBucket(installment.dueOn, asOf),
        originId: installment.id,
      });
    }
  }

  const forecastInflowLines = lines.filter(
    (item) => item.kind === CASH_FLOW_KINDS.Forecast && item.source === CASH_FORECAST_SOURCES.ReceivableInstallment,
  );
  const forecastOutflowLines = lines.filter(
    (item) => item.kind === CASH_FLOW_KINDS.Forecast && item.source === CASH_FORECAST_SOURCES.PayableInstallment,
  );
  const forecastInflows = normalizeForecastAmount(sumMoneyAmounts(forecastInflowLines.map((item) => item.amount)));
  const forecastOutflows = normalizeForecastAmount(sumMoneyAmounts(forecastOutflowLines.map((item) => item.amount)));
  const overdueInflows = normalizeForecastAmount(
    sumMoneyAmounts(forecastInflowLines.filter((item) => item.bucket === CASH_FORECAST_BUCKETS.Overdue).map((item) => item.amount)),
  );
  const overdueOutflows = normalizeForecastAmount(
    sumMoneyAmounts(forecastOutflowLines.filter((item) => item.bucket === CASH_FORECAST_BUCKETS.Overdue).map((item) => item.amount)),
  );

  const receivablePrincipal = normalizeForecastAmount(sumMoneyAmounts(activeReceivables.map((item) => item.principal)));
  const payablePrincipal = normalizeForecastAmount(sumMoneyAmounts(activePayables.map((item) => item.principal)));
  const receivableRealized = normalizeForecastAmount(realizedInflows);
  const payableRealized = normalizeForecastAmount(realizedOutflows);
  const receivableForecast = forecastInflows;
  const payableForecast = forecastOutflows;
  const horizonExcludedInflows = normalizeForecastAmount(excludedInflows);
  const horizonExcludedOutflows = normalizeForecastAmount(excludedOutflows);
  const balanced =
    moneyAmountsEqual(
      receivablePrincipal,
      sumMoneyAmounts([receivableRealized, receivableForecast, horizonExcludedInflows]),
    ) &&
    moneyAmountsEqual(
      payablePrincipal,
      sumMoneyAmounts([payableRealized, payableForecast, horizonExcludedOutflows]),
    );

  const projectedCash = normalizeForecastAmount(
    subtractMoneyAmounts(sumMoneyAmounts([realizedCash, forecastInflows]), forecastOutflows),
  );

  assertNoFalseRealized(lines);

  return {
    status: CASH_FORECAST_STATUSES.Projected,
    lines,
    realizedCash,
    realizedInflows: receivableRealized,
    realizedOutflows: payableRealized,
    forecastInflows,
    forecastOutflows,
    overdueInflows,
    overdueOutflows,
    projectedCash,
    reconciliation: {
      receivablePrincipal,
      receivableRealized,
      receivableForecast,
      payablePrincipal,
      payableRealized,
      payableForecast,
      horizonExcludedInflows,
      horizonExcludedOutflows,
      balanced,
    },
  };
}
