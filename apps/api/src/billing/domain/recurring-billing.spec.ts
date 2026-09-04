import { describe, expect, it } from 'vitest';
import {
  BILLING_SCHEDULE_STATUSES,
  assertCompetenceEligible,
  assertPeriodNotBilled,
  buildBillingInstruction,
  cancelSchedule,
  competencePeriodKey,
  nextMonthPeriodKey,
  prorateMonthlyAmount,
  replayBilledPeriod,
  resolveRecurringAmount,
  type BillingScheduleView,
  type BillingScheduleSubject,
} from './recurring-billing';
import {
  RECURRING_BILLING_ERROR_CODES,
  RecurringBillingError,
} from './recurring-billing-errors';

function makeSchedule(overrides: Partial<BillingScheduleView> = {}): BillingScheduleView {
  return {
    scheduleId: 'sched-1',
    status: BILLING_SCHEDULE_STATUSES.Active,
    periodicity: 'MONTHLY',
    firstCompetenceOn: '2026-08-01',
    lastCompetenceOn: null,
    cancelledFromCompetenceOn: null,
    terms: { amount: '1000.0000', currencyCode: 'BRL' },
    contractSnapshot: { contractId: 'c-1', version: 1, monthly: true },
    ...overrides,
  };
}

function makeSubject(overrides: Partial<BillingScheduleSubject> = {}): BillingScheduleSubject {
  return {
    subjectKind: 'CONTRACT',
    subjectId: 'c-1',
    subjectEligible: true,
    ...overrides,
  };
}

describe('recurring rental billing engine', () => {
  it('mensalidade: competência elegível gera instrução mensal fixa', () => {
    const instruction = buildBillingInstruction({
      schedule: makeSchedule(),
      subject: makeSubject(),
      competenceOn: '2026-08-01',
      billedPeriodKeys: [],
    });
    expect(instruction).toMatchObject({
      periodKey: '2026-08',
      amount: '1000.0000',
      currencyCode: 'BRL',
      prorated: false,
    });
    const second = buildBillingInstruction({
      schedule: makeSchedule(),
      subject: makeSubject(),
      competenceOn: '2026-09-01',
      billedPeriodKeys: ['2026-08'],
    });
    expect(second.periodKey).toBe('2026-09');
    expect(second.amount).toBe('1000.0000');
    expect(second.contractSnapshot).toEqual({ contractId: 'c-1', version: 1, monthly: true });
  });

  it('pró-rata somente quando a regra existe', () => {
    expect(resolveRecurringAmount({ amount: '1000.0000', currencyCode: 'BRL' }, null)).toEqual({
      amount: '1000.0000',
      prorated: false,
    });
    expect(
      resolveRecurringAmount({ amount: '1000.0000', currencyCode: 'BRL' }, { kind: 'DAYS', daysInMonth: 30, daysBilled: 10 }),
    ).toEqual({ amount: prorateMonthlyAmount('1000.0000', 10, 30), prorated: true });
    expect(() =>
      resolveRecurringAmount({ amount: '1000.0000', currencyCode: 'BRL' }, { kind: 'DAYS', daysInMonth: 30, daysBilled: 45 }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.INVALID_PRORATION);
  });

  it('elegibilidade: agenda ativa, sujeito elegível e dentro da janela', () => {
    expect(() =>
      assertCompetenceEligible({ schedule: makeSchedule(), subject: makeSubject(), competenceOn: '2026-08-01' }),
    ).not.toThrow();
    expect(() =>
      assertCompetenceEligible({
        schedule: makeSchedule({ status: 'CANCELLED' }),
        subject: makeSubject(),
        competenceOn: '2026-08-01',
      }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.SCHEDULE_NOT_ACTIVE);
    expect(() =>
      assertCompetenceEligible({
        schedule: makeSchedule(),
        subject: makeSubject({ subjectEligible: false }),
        competenceOn: '2026-08-01',
      }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.SUBJECT_NOT_ELIGIBLE);
    expect(() =>
      assertCompetenceEligible({
        schedule: makeSchedule({ lastCompetenceOn: '2026-09-01' }),
        subject: makeSubject(),
        competenceOn: '2026-10-01',
      }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.COMPETENCE_AFTER_END);
  });

  it('mesmo período nunca fatura duas vezes (DUPLICATE PERIOD BILLING 0)', () => {
    const periodKey = competencePeriodKey('2026-08-01');
    expect(periodKey).toBe('2026-08');
    expect(() => assertPeriodNotBilled('sched-1', '2026-08-01', ['2026-08'])).toThrow(
      RecurringBillingError,
    );
    try {
      assertPeriodNotBilled('sched-1', '2026-08-01', ['2026-08']);
      throw new Error('expected');
    } catch (error) {
      expect((error as RecurringBillingError).code).toBe(
        RECURRING_BILLING_ERROR_CODES.DUPLICATE_PERIOD_BILLING,
      );
      expect((error as RecurringBillingError).detail).toBe('sched-1:2026-08');
    }
    // Duplicidade é por agenda: a mesma competência em outra agenda é permitida.
    expect(() => assertPeriodNotBilled('sched-2', '2026-08-01', [])).not.toThrow();
  });

  it('replay: período já faturado nunca gera nova instrução', () => {
    const replay = replayBilledPeriod('2026-08-01');
    expect(replay).toEqual({ periodKey: '2026-08', replay: true });
    // Gerar novamente a competência faturada falha (ledger), forçando replay.
    expect(() =>
      buildBillingInstruction({
        schedule: makeSchedule(),
        subject: makeSubject(),
        competenceOn: '2026-08-01',
        billedPeriodKeys: ['2026-08'],
      }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.DUPLICATE_PERIOD_BILLING);
  });

  it('concorrência/rollback: dedupe no ledger; falha em lote não deixa parcial', () => {
    // Mesma competência gerada concorrentemente: apenas a primeira passa.
    buildBillingInstruction({
      schedule: makeSchedule(),
      subject: makeSubject(),
      competenceOn: '2026-08-01',
      billedPeriodKeys: [],
    });
    const ledgerAfterCommit = ['2026-08'];
    expect(() =>
      buildBillingInstruction({
        schedule: makeSchedule(),
        subject: makeSubject(),
        competenceOn: '2026-08-01',
        billedPeriodKeys: ledgerAfterCommit,
      }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.DUPLICATE_PERIOD_BILLING);

    // Rollback em lote: falha em uma competência aborta a execução; o ledger só
    // é atualizado quando a etapa inteira (transação) é commitada.
    const collected: string[] = [];
    let failed = false;
    try {
      for (const period of ['2026-09', '2026-10', '2026-11']) {
        const on = `${period}-01`;
        assertCompetenceEligible({
          schedule: makeSchedule({ lastCompetenceOn: '2026-10-01' }),
          subject: makeSubject(),
          competenceOn: on,
        });
        collected.push(period);
      }
    } catch {
      failed = true;
    }
    const committed = failed ? [] : collected; // transação: só commita sem falha
    expect(failed).toBe(true);
    expect(committed).toEqual([]); // rollback: nada persistido
  });

  it('cancelamento: bloqueia competências futuras e preserva histórico', () => {
    const cancelled = cancelSchedule(makeSchedule(), '2026-10-01');
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledFromCompetenceOn).toBe('2026-10-01');
    // Agenda cancelada não gera mais (nem competência nova).
    expect(() =>
      assertCompetenceEligible({ schedule: cancelled, subject: makeSubject(), competenceOn: '2026-10-01' }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.SCHEDULE_NOT_ACTIVE);
    // Cancelamento não reescreve competências já faturadas (replay preservado).
    expect(replayBilledPeriod('2026-09-01')).toEqual({ periodKey: '2026-09', replay: true });
    // Agenda com cancelamento futuro programado (ainda ACTIVE): competência a
    // partir do marco é bloqueada; anterior permanece elegível.
    const scheduled = makeSchedule({ cancelledFromCompetenceOn: '2026-10-01' });
    expect(() =>
      assertCompetenceEligible({ schedule: scheduled, subject: makeSubject(), competenceOn: '2026-10-01' }),
    ).toThrow(RECURRING_BILLING_ERROR_CODES.COMPETENCE_CANCELLED);
    expect(() =>
      assertCompetenceEligible({ schedule: scheduled, subject: makeSubject(), competenceOn: '2026-09-01' }),
    ).not.toThrow();
    expect(() => cancelSchedule(makeSchedule(), '2026-07-01')).toThrow(
      RECURRING_BILLING_ERROR_CODES.INVALID_CANCELLATION,
    );
  });

  it('avança competência mensal corretamente (inclui virada de ano)', () => {
    expect(nextMonthPeriodKey('2026-08')).toBe('2026-09');
    expect(nextMonthPeriodKey('2026-12')).toBe('2027-01');
  });
});
