import { describe, expect, it } from 'vitest';
import {
  PAYROLL_PERIOD_STATUSES,
  assertClosedPeriodUntouched,
  assertCloseChecksClear,
  closePayrollPeriod,
  reopenPayrollPeriod,
  type PayrollCloseCheck,
  type PayrollPeriodState,
} from './payroll-close';
import { PAYROLL_CLOSE_ERROR_CODES } from './payroll-close-errors';

function period(overrides: Partial<PayrollPeriodState> = {}): PayrollPeriodState {
  return {
    periodId: 'per-1',
    status: PAYROLL_PERIOD_STATUSES.Open,
    closedAt: null,
    closedByIdentityId: null,
    ...overrides,
  };
}

const OK_CHECKS: PayrollCloseCheck[] = [
  { label: 'resultados', status: 'OK' },
  { label: 'conferência contábil', status: 'OK' },
];

describe('payroll close', () => {
  it('close: competência fechada com cálculos aprovados', () => {
    const result = closePayrollPeriod({ period: period(), checks: OK_CHECKS, closedByIdentityId: 'mgr-1', closedAt: '2026-09-30T12:00:00.000Z' });
    expect(result).toMatchObject({ periodId: 'per-1', status: 'CLOSED', closedByIdentityId: 'mgr-1', approvedCalculationCount: 2 });
  });

  it('pendências críticas/inconsistências bloqueiam o fechamento (rollback: nada muda)', () => {
    const before = period();
    expect(() =>
      closePayrollPeriod({ period: before, checks: [{ label: 'pendente', status: 'PENDING' }], closedByIdentityId: 'x', closedAt: '2026-09-30T12:00:00.000Z' }),
    ).toThrow(PAYROLL_CLOSE_ERROR_CODES.CRITICAL_PENDING);
    expect(() =>
      closePayrollPeriod({ period: before, checks: [{ label: 'inconsistente', status: 'REJECTED' }], closedByIdentityId: 'x', closedAt: '2026-09-30T12:00:00.000Z' }),
    ).toThrow(PAYROLL_CLOSE_ERROR_CODES.INCONSISTENT);
    expect(before.status).toBe('OPEN');
    expect(() => assertCloseChecksClear([{ label: 'x', status: 'REJECTED' }])).toThrow(PAYROLL_CLOSE_ERROR_CODES.INCONSISTENT);
  });

  it('double-close e close concorrente são barrados (CLOSED imutável)', () => {
    const closed = period({ status: PAYROLL_PERIOD_STATUSES.Closed });
    expect(() => closePayrollPeriod({ period: closed, checks: OK_CHECKS, closedByIdentityId: 'x', closedAt: '2026-09-30T12:00:00.000Z' })).toThrow(
      PAYROLL_CLOSE_ERROR_CODES.ALREADY_CLOSED,
    );
    // Concorrente: o segundo fechamento observa o estado já CLOSED.
    expect(() => closePayrollPeriod({ period: closed, checks: OK_CHECKS, closedByIdentityId: 'y', closedAt: '2026-09-30T12:05:00.000Z' })).toThrow(
      PAYROLL_CLOSE_ERROR_CODES.ALREADY_CLOSED,
    );
    expect(() => assertClosedPeriodUntouched('CLOSED')).toThrow(PAYROLL_CLOSE_ERROR_CODES.IMMUTABLE);
  });

  it('reopen exige capability + motivo e gera auditoria', () => {
    const closed = period({ status: PAYROLL_PERIOD_STATUSES.Closed, closedAt: '2026-09-30T12:00:00.000Z', closedByIdentityId: 'mgr-1' });
    expect(() => reopenPayrollPeriod(closed, { hasReopenCapability: false, reason: 'x', reopenedByIdentityId: 'mgr-2', occurredAt: '2026-10-01T08:00:00.000Z' })).toThrow(
      PAYROLL_CLOSE_ERROR_CODES.REOPEN_UNAUTHORIZED,
    );
    expect(() => reopenPayrollPeriod(closed, { hasReopenCapability: true, reason: '   ', reopenedByIdentityId: 'mgr-2', occurredAt: '2026-10-01T08:00:00.000Z' })).toThrow(
      PAYROLL_CLOSE_ERROR_CODES.REOPEN_REASON_REQUIRED,
    );
    const reopened = reopenPayrollPeriod(closed, { hasReopenCapability: true, reason: 'Erro de apuração', reopenedByIdentityId: 'mgr-2', occurredAt: '2026-10-01T08:00:00.000Z' });
    expect(reopened.period.status).toBe('OPEN');
    expect(reopened.audit).toMatchObject({ eventType: 'PAYROLL_PERIOD_REOPENED', reason: 'Erro de apuração', reopenedByIdentityId: 'mgr-2' });
  });
});
