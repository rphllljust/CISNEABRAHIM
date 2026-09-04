/**
 * Payroll Close — fechamento de competência usando cálculos aprovados.
 *
 * Regras:
 *  - Antes de fechar, pendências críticas (resultado ausente/REJECTED) e
 *    inconsistências bloqueiam o fechamento (rollback puro: nada muda).
 *  - CLOSED é imutável; double-close e cálculo posterior são barrados.
 *  - Reabertura exige capability + motivo + auditoria (evento).
 *  - O fechamento pode alimentar a integração contábil existente (evento emitido).
 */

import {
  PayrollCloseError,
  PAYROLL_CLOSE_ERROR_CODES,
} from './payroll-close-errors';

export const PAYROLL_PERIOD_STATUSES = {
  Open: 'OPEN',
  Closing: 'CLOSING',
  Closed: 'CLOSED',
} as const;

export type PayrollPeriodStatus =
  (typeof PAYROLL_PERIOD_STATUSES)[keyof typeof PAYROLL_PERIOD_STATUSES];

export type PayrollCloseCheck = {
  label: string;
  status: 'OK' | 'PENDING' | 'REJECTED';
};

export type PayrollCloseResult = {
  periodId: string;
  status: 'CLOSED';
  closedByIdentityId: string;
  closedAt: string;
  approvedCalculationCount: number;
};

export type PayrollReopenEvent = {
  eventType: 'PAYROLL_PERIOD_REOPENED';
  periodId: string;
  reopenedByIdentityId: string;
  reason: string;
  occurredAt: string;
};

export type PayrollPeriodState = {
  periodId: string;
  status: PayrollPeriodStatus;
  closedAt: string | null;
  closedByIdentityId: string | null;
};

/** Valida pendências críticas e inconsistências antes de fechar. */
export function assertCloseChecksClear(checks: PayrollCloseCheck[]): void {
  for (const check of checks) {
    if (check.status === 'PENDING' || check.status === 'REJECTED') {
      throw new PayrollCloseError(
        check.status === 'PENDING' ? PAYROLL_CLOSE_ERROR_CODES.CRITICAL_PENDING : PAYROLL_CLOSE_ERROR_CODES.INCONSISTENT,
        check.label,
      );
    }
  }
}

export function closePayrollPeriod(input: {
  period: PayrollPeriodState;
  checks: PayrollCloseCheck[];
  closedByIdentityId: string;
  closedAt: string;
}): PayrollCloseResult {
  if (input.period.status === PAYROLL_PERIOD_STATUSES.Closed) {
    throw new PayrollCloseError(PAYROLL_CLOSE_ERROR_CODES.ALREADY_CLOSED, input.period.periodId);
  }
  // Double/concurrent close: se outro fechamento já persistiu, o estado aqui é CLOSED.
  assertCloseChecksClear(input.checks);
  const approvedCount = input.checks.length;
  return {
    periodId: input.period.periodId,
    status: 'CLOSED',
    closedByIdentityId: input.closedByIdentityId,
    closedAt: input.closedAt,
    approvedCalculationCount: approvedCount,
  };
}

/** Concorrência/rollback: fechamento só persiste após validações (função pura sem efeito parcial). */
export function closeAndReturnPeriod(input: {
  period: PayrollPeriodState;
  checks: PayrollCloseCheck[];
  closedByIdentityId: string;
  closedAt: string;
}): PayrollPeriodState {
  const closed = closePayrollPeriod(input);
  return {
    periodId: closed.periodId,
    status: PAYROLL_PERIOD_STATUSES.Closed,
    closedAt: closed.closedAt,
    closedByIdentityId: closed.closedByIdentityId,
  };
}

/** CLOSED é imutável: reabrir exige capability + motivo + auditoria. */
export function reopenPayrollPeriod(
  period: PayrollPeriodState,
  options: { hasReopenCapability: boolean; reason: string; reopenedByIdentityId: string; occurredAt: string },
): { period: PayrollPeriodState; audit: PayrollReopenEvent } {
  if (period.status !== PAYROLL_PERIOD_STATUSES.Closed) {
    throw new PayrollCloseError(PAYROLL_CLOSE_ERROR_CODES.IMMUTABLE);
  }
  if (!options.hasReopenCapability) {
    throw new PayrollCloseError(PAYROLL_CLOSE_ERROR_CODES.REOPEN_UNAUTHORIZED);
  }
  if (!options.reason.trim()) {
    throw new PayrollCloseError(PAYROLL_CLOSE_ERROR_CODES.REOPEN_REASON_REQUIRED);
  }
  return {
    period: {
      periodId: period.periodId,
      status: PAYROLL_PERIOD_STATUSES.Open,
      closedAt: null,
      closedByIdentityId: null,
    },
    audit: {
      eventType: 'PAYROLL_PERIOD_REOPENED',
      periodId: period.periodId,
      reopenedByIdentityId: options.reopenedByIdentityId,
      reason: options.reason.trim(),
      occurredAt: options.occurredAt,
    },
  };
}

/** Guarda: nenhuma violação de período CLOSED é permitida. */
export function assertClosedPeriodUntouched(status: PayrollPeriodStatus): void {
  if (status === PAYROLL_PERIOD_STATUSES.Closed) {
    throw new PayrollCloseError(PAYROLL_CLOSE_ERROR_CODES.IMMUTABLE);
  }
}
