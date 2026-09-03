import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_PAYABLE_ORIGIN_KINDS,
  PAYABLE_AGING_BUCKETS,
  PAYABLE_LIFECYCLES,
  PAYABLE_ORIGIN_KINDS,
  PAYABLE_STATUSES,
  PAYMENT_KINDS,
  assertNoInstallmentOverpayment,
  assertNoOverpayment,
  assertPayableActive,
  assertPayableOriginKind,
  assertPaymentImmutable,
  assertReversalAmount,
  classifyPayableAging,
  derivePayableStatus,
  remainingBalance,
  reconcilePayable,
  summarizePayableAging,
} from './payable';
import { validateOpenPayableInput } from './payable.validation';

describe('payable domain', () => {
  const payment = (amount: string, installmentId = 'inst-1') => ({
    kind: PAYMENT_KINDS.Payment,
    amount,
    installmentId,
  });

  const reversal = (amount: string, installmentId = 'inst-1') => ({
    kind: PAYMENT_KINDS.Reversal,
    amount,
    installmentId,
  });

  it('derives OPEN, PARTIALLY_PAID, PAID, OVERDUE and CANCELLED without a paid boolean', () => {
    expect(
      derivePayableStatus({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [],
        dueDate: '2099-01-01',
      }),
    ).toBe(PAYABLE_STATUSES.Open);

    expect(
      derivePayableStatus({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [payment('40.0000')],
        dueDate: '2099-01-01',
      }),
    ).toBe(PAYABLE_STATUSES.PartiallyPaid);

    expect(
      derivePayableStatus({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [payment('100.0000')],
        dueDate: '2020-01-01',
      }),
    ).toBe(PAYABLE_STATUSES.Paid);

    expect(
      derivePayableStatus({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [payment('10.0000')],
        dueDate: '2020-01-01',
        asOf: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).toBe(PAYABLE_STATUSES.Overdue);

    expect(
      derivePayableStatus({
        lifecycle: PAYABLE_LIFECYCLES.Cancelled,
        principal: '100.0000',
        payments: [],
        dueDate: '2099-01-01',
      }),
    ).toBe(PAYABLE_STATUSES.Cancelled);
  });

  it('derives remaining from principal minus posted payments plus reversals', () => {
    expect(remainingBalance('100.50', [payment('40.25'), payment('10.25')])).toBe('50');
    expect(remainingBalance('100.0000', [payment('40.0000'), reversal('10.0000')])).toBe('70');
  });

  it('rejects overpayment, cancelled pay, and silent edit of a confirmed payment', () => {
    expect(() => assertNoOverpayment('100.0000', [payment('80.0000')], '30.0000')).toThrowError(
      'PAYABLE_OVERPAYMENT',
    );
    expect(() =>
      assertNoInstallmentOverpayment('40.0000', [payment('40.0000', 'i1')], 'i1', '0.0001'),
    ).toThrowError('PAYABLE_OVERPAYMENT');
    expect(() => assertPayableActive(PAYABLE_LIFECYCLES.Cancelled)).toThrowError('PAYABLE_CANCELLED');
    expect(() => assertPaymentImmutable()).toThrowError('PAYMENT_IMMUTABLE');
  });

  it('rejects client purchase order as a payable origin', () => {
    for (const kind of FORBIDDEN_PAYABLE_ORIGIN_KINDS) {
      expect(() => assertPayableOriginKind(kind)).toThrowError('PAYABLE_FORBIDDEN_ORIGIN');
    }
    expect(assertPayableOriginKind(PAYABLE_ORIGIN_KINDS.SupplierInvoice)).toBe(
      PAYABLE_ORIGIN_KINDS.SupplierInvoice,
    );
    expect(() =>
      validateOpenPayableInput({
        unitId: 'unit-a',
        counterpartyId: '11111111-1111-4111-8111-111111111111',
        originKind: 'CLIENT_PURCHASE_ORDER',
        originId: '22222222-2222-4222-8222-222222222222',
        originReference: 'PO-CLIENT-1',
        expenseCategoryId: '33333333-3333-4333-8333-333333333333',
        costCenterId: '44444444-4444-4444-8444-444444444444',
        costCenterCode: 'CC-01',
        principal: '10.0000',
        currencyCode: 'BRL',
        dueDate: '2099-01-01',
        paymentTerms: 'a vista',
      }),
    ).toThrowError('PAYABLE_FORBIDDEN_ORIGIN');
  });

  it('classifies AP aging buckets from remaining and due date', () => {
    const asOf = new Date('2026-09-01T00:00:00.000Z');
    expect(
      classifyPayableAging({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [],
        dueDate: '2026-09-10',
        asOf,
      }),
    ).toBe(PAYABLE_AGING_BUCKETS.Current);
    expect(
      classifyPayableAging({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [payment('20.0000')],
        dueDate: '2026-08-20',
        asOf,
      }),
    ).toBe(PAYABLE_AGING_BUCKETS.Days1To30);
    expect(
      classifyPayableAging({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [],
        dueDate: '2026-07-01',
        asOf,
      }),
    ).toBe(PAYABLE_AGING_BUCKETS.Days61To90);
    expect(
      classifyPayableAging({
        lifecycle: PAYABLE_LIFECYCLES.Active,
        principal: '100.0000',
        payments: [payment('100.0000')],
        dueDate: '2020-01-01',
        asOf,
      }),
    ).toBe(PAYABLE_AGING_BUCKETS.Settled);

    const summary = summarizePayableAging(
      [
        {
          lifecycle: PAYABLE_LIFECYCLES.Active,
          principal: '50.0000',
          payments: [],
          dueDate: '2026-08-20',
        },
        {
          lifecycle: PAYABLE_LIFECYCLES.Active,
          principal: '25.0000',
          payments: [],
          dueDate: '2026-09-10',
        },
      ],
      asOf,
    );
    expect(summary[PAYABLE_AGING_BUCKETS.Days1To30].count).toBe(1);
    expect(summary[PAYABLE_AGING_BUCKETS.Current].count).toBe(1);
  });

  it('reconciles without negative balance when payments are valid', () => {
    const result = reconcilePayable({
      principal: '250.0000',
      payments: [payment('100.0000'), payment('150.0000')],
    });
    expect(result.remaining).toBe('0');
    expect(result.paid).toBe('250');
    expect(result.negativeBalance).toBe(false);
  });

  it('caps reversal to the original payment and restores remaining', () => {
    expect(assertReversalAmount('40.0000', [], '40.0000')).toBe('40.0000');
    expect(() => assertReversalAmount('40.0000', ['40.0000'], '0.0001')).toThrowError(
      'PAYABLE_REVERSAL_EXCEEDS_PAYMENT',
    );
    const afterReverse = remainingBalance('100.0000', [payment('40.0000'), reversal('40.0000')]);
    expect(afterReverse).toBe('100');
  });
});
