import { describe, expect, it } from 'vitest';
import {
  PAYMENT_KINDS,
  buildReversePaymentPayload,
  paymentCanBeReversed,
  paymentWasReversed,
  selectReversablePayments,
  type PaymentLike,
} from './payable-actions';

function payment(id: string, kind: string, overrides: Partial<PaymentLike> = {}): PaymentLike {
  return {
    id,
    kind,
    amount: '100.0000',
    reversesPaymentId: null,
    ...overrides,
  };
}

describe('paymentWasReversed', () => {
  it('returns true when another payment references the payment as reversal target', () => {
    const payments = [payment('p1', 'PAYMENT'), payment('p2', 'REVERSAL', { reversesPaymentId: 'p1' })];
    expect(paymentWasReversed('p1', payments)).toBe(true);
  });

  it('returns false when no reversal references the payment', () => {
    const payments = [payment('p1', 'PAYMENT'), payment('p2', 'PAYMENT')];
    expect(paymentWasReversed('p1', payments)).toBe(false);
  });
});

describe('paymentCanBeReversed', () => {
  it('allows an unreversed PAYMENT on an active payable', () => {
    const payments = [payment('p1', 'PAYMENT')];
    expect(paymentCanBeReversed(payments[0]!, payments, true)).toBe(true);
  });

  it('blocks REVERSAL payments as reversal source (immutable in the backend)', () => {
    const payments = [payment('p1', 'REVERSAL')];
    expect(paymentCanBeReversed(payments[0]!, payments, true)).toBe(false);
  });

  it('blocks an already reversed payment', () => {
    const payments = [payment('p1', 'PAYMENT'), payment('p2', 'REVERSAL', { reversesPaymentId: 'p1' })];
    expect(paymentCanBeReversed(payments[0]!, payments, true)).toBe(false);
  });

  it('blocks every payment while the payable is not active', () => {
    const payments = [payment('p1', 'PAYMENT')];
    expect(paymentCanBeReversed(payments[0]!, payments, false)).toBe(false);
  });

  it('blocks unknown kinds without inventing states', () => {
    const payments = [payment('p1', 'SOMETHING_ELSE')];
    expect(paymentCanBeReversed(payments[0]!, payments, true)).toBe(false);
  });
});

describe('selectReversablePayments', () => {
  it('returns only reversible payments preserving order', () => {
    const payments = [
      payment('p1', 'PAYMENT'),
      payment('p2', 'REVERSAL', { reversesPaymentId: 'p1' }),
      payment('p3', 'PAYMENT'),
      payment('p4', 'REVERSAL'),
    ];
    expect(selectReversablePayments(payments, true).map((item) => item.id)).toEqual(['p3']);
  });

  it('returns an empty list for a non-active payable', () => {
    const payments = [payment('p1', 'PAYMENT')];
    expect(selectReversablePayments(payments, false)).toEqual([]);
  });
});

describe('buildReversePaymentPayload', () => {
  it('builds the exact backend payload with the required keys', () => {
    const payload = buildReversePaymentPayload({
      rowVersion: 3,
      paymentReference: 'REF-REV-001',
      reason: 'Pagamento duplicado',
      idempotencyKey: 'idem-1',
    });
    expect(payload).toEqual({
      rowVersion: 3,
      idempotencyKey: 'idem-1',
      paymentReference: 'REF-REV-001',
      reason: 'Pagamento duplicado',
    });
  });

  it('adds amount only when the user typed one (backend defaults to full value)', () => {
    const payload = buildReversePaymentPayload({
      rowVersion: 1,
      paymentReference: 'REF',
      reason: 'Motivo',
      amount: '  40.0000  ',
      idempotencyKey: 'idem-2',
    });
    expect(payload.amount).toBe('40.0000');
  });

  it('omits amount and payment kind flags when absent', () => {
    const payload = buildReversePaymentPayload({
      rowVersion: 1,
      paymentReference: 'REF',
      reason: 'Motivo',
      idempotencyKey: 'idem-3',
    });
    expect('amount' in payload).toBe(false);
    expect(PAYMENT_KINDS.Payment).toBe('PAYMENT');
  });
});
