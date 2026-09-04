import { describe, expect, it } from 'vitest';
import { PAYROLL_PERIOD_STATUS, periodActionsForStatus } from './period-action-state';

describe('periodActionsForStatus', () => {
  it('allows calculate on OPEN and blocks close/reopen with reasons', () => {
    const actions = periodActionsForStatus(PAYROLL_PERIOD_STATUS.OPEN, { hasUnitId: true });
    expect(actions.calculate.available).toBe(true);
    expect(actions.close.available).toBe(false);
    expect(actions.close.reason).toBe('Calcule o período antes de fechar.');
    expect(actions.reopen.available).toBe(false);
    expect(actions.reopen.reason).toBe('Somente períodos fechados podem ser reabertos.');
  });

  it('allows calculate and close on CALCULATED and blocks reopen', () => {
    const actions = periodActionsForStatus(PAYROLL_PERIOD_STATUS.CALCULATED, { hasUnitId: true });
    expect(actions.calculate.available).toBe(true);
    expect(actions.close.available).toBe(true);
    expect(actions.close.reason).toBeUndefined();
    expect(actions.reopen.available).toBe(false);
    expect(actions.reopen.reason).toBe('Somente períodos fechados podem ser reabertos.');
  });

  it('treats CLOSED as immutable: only reopen is available', () => {
    const actions = periodActionsForStatus(PAYROLL_PERIOD_STATUS.CLOSED, { hasUnitId: true });
    expect(actions.reopen.available).toBe(true);
    expect(actions.calculate.available).toBe(false);
    expect(actions.calculate.reason).toMatch(/fechado e é imutável/i);
    expect(actions.close.available).toBe(false);
    expect(actions.close.reason).toBe('O período já está fechado.');
  });

  it('blocks every action for an unknown status without inventing states', () => {
    const actions = periodActionsForStatus('SOMETHING_ELSE', { hasUnitId: true });
    expect(actions.calculate.available).toBe(false);
    expect(actions.close.available).toBe(false);
    expect(actions.reopen.available).toBe(false);
    expect(actions.calculate.reason).toBe('Status de período não reconhecido: SOMETHING_ELSE.');
  });

  it('requires a unit before any action regardless of status', () => {
    for (const status of Object.values(PAYROLL_PERIOD_STATUS)) {
      const actions = periodActionsForStatus(status, { hasUnitId: false });
      expect(actions.calculate.available).toBe(false);
      expect(actions.close.available).toBe(false);
      expect(actions.reopen.available).toBe(false);
      expect(actions.calculate.reason).toBe('Informe a unidade para executar ações no período.');
    }
  });
});
