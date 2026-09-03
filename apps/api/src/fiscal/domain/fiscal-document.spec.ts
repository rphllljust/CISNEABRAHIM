import { describe, expect, it } from 'vitest';
import {
  ALLOWED_FISCAL_TRANSITIONS,
  FISCAL_GATEWAY_OUTCOMES,
  FISCAL_STATUSES,
  assertItems,
  assertParties,
  assertPayloadMutable,
  assertTransition,
  nextStatusFromGateway,
} from './fiscal-document';

describe('fiscal document domain', () => {
  it('allows the official conceptual lifecycle and forbids silent authorized mutation', () => {
    assertTransition(FISCAL_STATUSES.Draft, FISCAL_STATUSES.Ready);
    assertTransition(FISCAL_STATUSES.Ready, FISCAL_STATUSES.Submitted);
    assertTransition(FISCAL_STATUSES.Submitted, FISCAL_STATUSES.Authorized);
    assertTransition(FISCAL_STATUSES.Authorized, FISCAL_STATUSES.Cancelled);
    expect(() => assertTransition(FISCAL_STATUSES.Authorized, FISCAL_STATUSES.Draft)).toThrowError(
      'FISCAL_INVALID_TRANSITION',
    );
    expect(() => assertPayloadMutable(FISCAL_STATUSES.Authorized)).toThrowError(
      'FISCAL_DOCUMENT_IMMUTABLE',
    );
    expect(ALLOWED_FISCAL_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('maps gateway outcomes without inventing a tax engine', () => {
    expect(nextStatusFromGateway(FISCAL_GATEWAY_OUTCOMES.Authorized)).toBe(FISCAL_STATUSES.Authorized);
    expect(nextStatusFromGateway(FISCAL_GATEWAY_OUTCOMES.Rejected)).toBe(FISCAL_STATUSES.Rejected);
    expect(nextStatusFromGateway(FISCAL_GATEWAY_OUTCOMES.Timeout)).toBe(FISCAL_STATUSES.Submitted);
    expect(() => nextStatusFromGateway('ISSUED_WITH_FAKE_RATE')).toThrowError(
      'FISCAL_INVALID_GATEWAY_OUTCOME',
    );
  });

  it('requires issuer and recipient snapshots and at least one item', () => {
    expect(() => assertParties([])).toThrowError('FISCAL_PARTIES_REQUIRED');
    assertParties([
      { role: 'ISSUER', legalName: 'Issuer', taxIdentifier: 'ISSUER-1' },
      { role: 'RECIPIENT', legalName: 'Recipient', taxIdentifier: 'RECIPIENT-1' },
    ]);
    expect(() => assertItems([])).toThrowError('FISCAL_ITEMS_REQUIRED');
    assertItems([
      {
        lineNumber: 1,
        description: 'Service snapshot',
        quantity: '1.0000',
        unitAmount: '10.0000',
        lineAmount: '10.0000',
      },
    ]);
  });
});
