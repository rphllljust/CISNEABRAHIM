import { describe, expect, it } from 'vitest';
import { assertContractTransition, CONTRACT_STATUSES } from './contract';

describe('contract transitions', () => {
  it('allows DRAFT to ACTIVE', () => {
    expect(assertContractTransition(CONTRACT_STATUSES.Draft, CONTRACT_STATUSES.Active)).toBe(true);
  });

  it('allows ACTIVE to CLOSED or EXPIRED', () => {
    expect(assertContractTransition(CONTRACT_STATUSES.Active, CONTRACT_STATUSES.Closed)).toBe(true);
    expect(assertContractTransition(CONTRACT_STATUSES.Active, CONTRACT_STATUSES.Expired)).toBe(true);
  });

  it('rejects closed or expired from originating new transitions', () => {
    expect(assertContractTransition(CONTRACT_STATUSES.Closed, CONTRACT_STATUSES.Active)).toBe(false);
    expect(assertContractTransition(CONTRACT_STATUSES.Expired, CONTRACT_STATUSES.Active)).toBe(false);
    expect(assertContractTransition(CONTRACT_STATUSES.Draft, CONTRACT_STATUSES.Closed)).toBe(false);
  });
});
