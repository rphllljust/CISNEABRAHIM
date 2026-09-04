import { describe, expect, it } from 'vitest';
import { isIdempotentAck } from './is-idempotent-ack';

describe('isIdempotentAck', () => {
  it('returns false when there is no response', () => {
    expect(isIdempotentAck(null)).toBe(false);
    expect(isIdempotentAck(undefined)).toBe(false);
  });

  it('returns true only when the server flags idempotent: true', () => {
    expect(isIdempotentAck({ idempotent: true })).toBe(true);
    expect(isIdempotentAck({ idempotent: false })).toBe(false);
  });

  it('accepts a full PayrollEventResponse payload', () => {
    const recorded = {
      id: 'e-1',
      payrollPeriodId: 'p-1',
      employmentContractId: 'c-1',
      eventKind: 'EARNING',
      amount: '1000.0000',
      componentLabel: 'TEST_SALARY',
      description: 'Salário',
      formulaStatus: 'UNDECIDED',
      idempotencyKey: 'key-1',
      idempotent: true,
    };
    expect(isIdempotentAck(recorded)).toBe(true);
  });
});
