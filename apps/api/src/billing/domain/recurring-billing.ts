/**
 * Recurring Rental Billing — agenda de cobrança (BillingSchedule) para
 * contratos/locações recorrentes.
 *
 * Interpretação de engenharia: o engine é puro e não inventa regras. Pró-rata
 * só é aplicado quando uma regra de proporcionalização é fornecida; valor da
 * mensalidade vem dos termos da agenda. Alteração de contrato nunca reescreve
 * cobrança histórica: cada competência faturada guarda o snapshot do contrato
 * no instante da geração (imutável). O mesmo período nunca é faturado duas
 * vezes (ledger único por (schedule, competência) + constraint no banco).
 */

import {
  RecurringBillingError,
  RECURRING_BILLING_ERROR_CODES,
} from './recurring-billing-errors';

export const BILLING_SCHEDULE_PERIODICITY = {
  Monthly: 'MONTHLY',
} as const;

export const BILLING_SCHEDULE_STATUSES = {
  Active: 'ACTIVE',
  Cancelled: 'CANCELLED',
} as const;

export type BillingScheduleStatus =
  (typeof BILLING_SCHEDULE_STATUSES)[keyof typeof BILLING_SCHEDULE_STATUSES];

export type BillingScheduleTerms = {
  /** Valor mensal fixo (escala 4). */
  amount: string;
  currencyCode: string;
};

export type BillingScheduleSubject = {
  subjectKind: 'CONTRACT' | 'RENTAL';
  subjectId: string;
  /** Sujeito elegível (ex.: contrato ACTIVE) avaliado pelo chamador na data. */
  subjectEligible: boolean;
};

export type BillingScheduleView = {
  scheduleId: string;
  status: BillingScheduleStatus;
  periodicity: 'MONTHLY';
  firstCompetenceOn: string;
  lastCompetenceOn: string | null;
  /** A partir desta competência a agenda está cancelada (competências >= bloqueadas). */
  cancelledFromCompetenceOn: string | null;
  terms: BillingScheduleTerms;
  /** Snapshot do contrato capturado na criação/ativação (imutável por competência). */
  contractSnapshot: Record<string, unknown>;
};

export type PeriodEligibilityInput = {
  schedule: BillingScheduleView;
  subject: BillingScheduleSubject;
  /** Competência em avaliação (YYYY-MM-DD, dia 1 do mês). */
  competenceOn: string;
};

export type BillingInstruction = {
  scheduleId: string;
  subjectKind: string;
  subjectId: string;
  periodKey: string;
  competenceOn: string;
  amount: string;
  currencyCode: string;
  contractSnapshot: Record<string, unknown>;
  prorated: boolean;
};

export type ProRataRule = {
  kind: 'DAYS';
  daysInMonth: number;
  daysBilled: number;
};

export function competencePeriodKey(competenceOn: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(competenceOn) || !competenceOn.endsWith('-01')) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.INVALID_COMPETENCE);
  }
  return competenceOn.slice(0, 7);
}

export function nextMonthPeriodKey(periodKey: string): string {
  const [year, month] = periodKey.split('-').map(Number) as [number, number];
  if (!year || !month || month < 1 || month > 12) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.INVALID_COMPETENCE);
  }
  const next = new Date(Date.UTC(year, month, 1)); // mês base 1 -> 0-based
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function competenceOnForPeriodKey(periodKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.INVALID_COMPETENCE);
  }
  return `${periodKey}-01`;
}

/** Elegibilidade da competência: agenda ativa, sujeito elegível e dentro da janela. */
export function assertCompetenceEligible(input: PeriodEligibilityInput): void {
  const { schedule, subject, competenceOn } = input;
  const periodKey = competencePeriodKey(competenceOn);

  if (schedule.status !== BILLING_SCHEDULE_STATUSES.Active) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.SCHEDULE_NOT_ACTIVE);
  }
  if (!subject.subjectEligible) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.SUBJECT_NOT_ELIGIBLE);
  }
  if (competenceOn < schedule.firstCompetenceOn) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.COMPETENCE_BEFORE_START);
  }
  if (schedule.lastCompetenceOn !== null && competenceOn > schedule.lastCompetenceOn) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.COMPETENCE_AFTER_END);
  }
  if (schedule.cancelledFromCompetenceOn !== null && competenceOn >= schedule.cancelledFromCompetenceOn) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.COMPETENCE_CANCELLED);
  }
  void periodKey;
}

/** Ledger: mesmo período (schedule + YYYY-MM) nunca gera duas cobranças. */
export function assertPeriodNotBilled(
  scheduleId: string,
  competenceOn: string,
  billedPeriodKeys: readonly string[],
): void {
  if (billedPeriodKeys.includes(competencePeriodKey(competenceOn))) {
    throw new RecurringBillingError(
      RECURRING_BILLING_ERROR_CODES.DUPLICATE_PERIOD_BILLING,
      `${scheduleId}:${competencePeriodKey(competenceOn)}`,
    );
  }
}

/**
 * Mensalidade: valor mensal fixo dos termos. Pró-rata somente quando uma regra
 * for fornecida (dias faturados / dias do mês sobre o valor mensal).
 */
export function resolveRecurringAmount(
  terms: BillingScheduleTerms,
  prorata?: ProRataRule | null,
): { amount: string; prorated: boolean } {
  if (!prorata) {
    return { amount: terms.amount, prorated: false };
  }
  if (prorata.daysInMonth < 1 || prorata.daysBilled < 0 || prorata.daysBilled > prorata.daysInMonth) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.INVALID_PRORATION);
  }
  if (prorata.daysBilled === prorata.daysInMonth) {
    return { amount: terms.amount, prorated: false };
  }
  return {
    amount: prorateMonthlyAmount(terms.amount, prorata.daysBilled, prorata.daysInMonth),
    prorated: true,
  };
}

export function prorateMonthlyAmount(
  fullMonthlyAmount: string,
  daysBilled: number,
  daysInMonth: number,
): string {
  const amountScaled = toScaled(fullMonthlyAmount);
  const result = (amountScaled * BigInt(daysBilled)) / BigInt(daysInMonth);
  return fromScaled(result);
}

/** Gera a instrução de Billing de uma competência elegível (engine puro). */
export function buildBillingInstruction(
  input: PeriodEligibilityInput & {
    billedPeriodKeys: readonly string[];
    prorata?: ProRataRule | null;
  },
): BillingInstruction {
  assertCompetenceEligible(input);
  assertPeriodNotBilled(input.schedule.scheduleId, input.competenceOn, input.billedPeriodKeys);
  const { amount, prorated } = resolveRecurringAmount(input.schedule.terms, input.prorata);
  const periodKey = competencePeriodKey(input.competenceOn);
  return {
    scheduleId: input.schedule.scheduleId,
    subjectKind: input.subject.subjectKind,
    subjectId: input.subject.subjectId,
    periodKey,
    competenceOn: input.competenceOn,
    amount,
    currencyCode: input.schedule.terms.currencyCode,
    contractSnapshot: { ...input.schedule.contractSnapshot },
    prorated,
  };
}

/**
 * Replay de período já faturado: retorna a instrução armazenada (nunca gera
 * nova cobrança). Concorrência é resolvida pela unicidade do ledger + FOR
 * UPDATE/constraint no repositório.
 */
export function replayBilledPeriod(competenceOn: string): { periodKey: string; replay: true } {
  return { periodKey: competencePeriodKey(competenceOn), replay: true };
}

/**
 * Cancelamento: bloqueia competências >= cancelledFromCompetenceOn. Nenhuma
 * instrução histórica é modificada (rollback/forma pura: sem efeitos parciais).
 */
export function cancelSchedule(
  schedule: BillingScheduleView,
  cancelledFromCompetenceOn: string,
): BillingScheduleView {
  competencePeriodKey(cancelledFromCompetenceOn);
  if (cancelledFromCompetenceOn < schedule.firstCompetenceOn) {
    throw new RecurringBillingError(RECURRING_BILLING_ERROR_CODES.INVALID_CANCELLATION);
  }
  return {
    ...schedule,
    cancelledFromCompetenceOn,
    status: BILLING_SCHEDULE_STATUSES.Cancelled,
  };
}

function toScaled(value: string): bigint {
  const [whole, fraction = ''] = String(value).trim().split('.');
  const padded = (fraction.padEnd(4, '0')).slice(0, 4);
  return BigInt(whole || '0') * 10_000n + BigInt(padded || '0');
}

function fromScaled(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 10_000n;
  const fraction = (absolute % 10_000n).toString().padStart(4, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}
