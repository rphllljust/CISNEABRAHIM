import { describe, expect, it } from 'vitest';
import {
  assertNoPrivilegedFields,
  PrivilegedFieldError,
} from './forbidden-payload-fields';

describe('assertNoPrivilegedFields', () => {
  it('rejects privileged fields on create', () => {
    expect(() => assertNoPrivilegedFields({ legalName: 'ACME', status: 'ACTIVE' })).toThrow(
      PrivilegedFieldError,
    );
  });

  it('rejects role, scope, price and internalCost', () => {
    for (const field of ['role', 'scope', 'price', 'internalCost', 'createdBy']) {
      expect(() => assertNoPrivilegedFields({ [field]: 'x' })).toThrow(PrivilegedFieldError);
    }
  });

  it('allows version on update when configured', () => {
    expect(() =>
      assertNoPrivilegedFields({ version: 2, legalName: 'ACME' }, { allowVersion: true }),
    ).not.toThrow();
  });

  it('allows rowVersion on update when configured', () => {
    expect(() =>
      assertNoPrivilegedFields({ rowVersion: 3, title: 'x' }, { allowRowVersion: true }),
    ).not.toThrow();
  });

  it('still rejects status on update', () => {
    expect(() =>
      assertNoPrivilegedFields({ version: 2, status: 'APPROVED' }, { allowVersion: true }),
    ).toThrow(PrivilegedFieldError);
  });
});
