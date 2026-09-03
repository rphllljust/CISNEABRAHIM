import { describe, expect, it } from 'vitest';
import {
  assertContractActivationValidity,
  assertContractOperationalUse,
  CONTRACT_OPERATIONAL_ERROR_CODES,
  ContractOperationalError,
} from './contract-operational';

describe('contract-operational', () => {
  const activeContract = {
    clientId: 'client-a',
    status: 'ACTIVE',
    validFrom: '2020-01-01',
    validTo: '2030-12-31',
  };

  it('allows operational use for active contract within validity', () => {
    expect(() =>
      assertContractOperationalUse(activeContract, 'client-a', new Date('2025-06-01T12:00:00Z')),
    ).not.toThrow();
  });

  it('rejects client mismatch', () => {
    try {
      assertContractOperationalUse(activeContract, 'client-b');
    } catch (error) {
      expect((error as ContractOperationalError).code).toBe(
        CONTRACT_OPERATIONAL_ERROR_CODES.CLIENT_MISMATCH,
      );
    }
  });

  it('rejects contract not yet valid', () => {
    expect(() =>
      assertContractOperationalUse(
        { ...activeContract, validFrom: '2099-01-01' },
        'client-a',
        new Date('2025-06-01T12:00:00Z'),
      ),
    ).toThrow(CONTRACT_OPERATIONAL_ERROR_CODES.NOT_YET_VALID);
  });

  it('rejects expired contract by validity window', () => {
    expect(() =>
      assertContractOperationalUse(
        { ...activeContract, validTo: '2020-12-31' },
        'client-a',
        new Date('2025-06-01T12:00:00Z'),
      ),
    ).toThrow(CONTRACT_OPERATIONAL_ERROR_CODES.EXPIRED);
  });

  it('rejects closed contract', () => {
    expect(() =>
      assertContractOperationalUse({ ...activeContract, status: 'CLOSED' }, 'client-a'),
    ).toThrow(CONTRACT_OPERATIONAL_ERROR_CODES.CLOSED);
  });

  it('rejects activation when validity window already ended', () => {
    expect(() =>
      assertContractActivationValidity({
        validFrom: '2020-01-01',
        validTo: '2020-12-31',
        asOf: new Date('2025-06-01T12:00:00Z'),
      }),
    ).toThrow(CONTRACT_OPERATIONAL_ERROR_CODES.EXPIRED);
  });
});