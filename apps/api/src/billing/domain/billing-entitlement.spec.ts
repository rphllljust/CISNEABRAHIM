import { describe, expect, it } from 'vitest';
import {
  assertBillingRight,
  assertPurchaseOrderRequirement,
  BILLING_ENTITLEMENT_POLICIES,
  BillingEntitlementError,
  PURCHASE_ORDER_REQUIREMENTS,
  requiresApprovedMeasurement,
  resolveBillingEntitlementPolicy,
  resolveContractualBillingLine,
} from './billing-entitlement';

describe('billing-entitlement', () => {
  it('defaults to measurement-approved when the snapshot omits the policy', () => {
    expect(resolveBillingEntitlementPolicy({})).toBe(BILLING_ENTITLEMENT_POLICIES.MeasurementApproved);
    expect(requiresApprovedMeasurement(BILLING_ENTITLEMENT_POLICIES.MeasurementApproved)).toBe(true);
    expect(requiresApprovedMeasurement(BILLING_ENTITLEMENT_POLICIES.FixedPrice)).toBe(false);
  });

  it('blocks measurement-required billing without an approved measurement', () => {
    expect(() =>
      assertBillingRight({
        policy: BILLING_ENTITLEMENT_POLICIES.MeasurementApproved,
        serviceOrderStatus: 'COMPLETED',
        measurementStatus: 'SUBMITTED',
      }),
    ).toThrow(BillingEntitlementError);
  });

  it('allows fixed-price billing from completed execution without a measurement', () => {
    expect(() =>
      assertBillingRight({
        policy: BILLING_ENTITLEMENT_POLICIES.FixedPrice,
        serviceOrderStatus: 'COMPLETED',
      }),
    ).not.toThrow();
  });

  it('resolves a contractual line from proposal amount and refuses invented amounts', () => {
    expect(
      resolveContractualBillingLine({
        serviceSnapshot: { measurementModel: { defaultUnitCode: 'MONTH' } },
        proposalSnapshot: { globalSalePrice: '2500.0000', currencyCode: 'BRL' },
        purchaseOrderSnapshot: null,
      }).lineAmount,
    ).toBe('2500.0000');

    expect(() =>
      resolveContractualBillingLine({
        serviceSnapshot: null,
        proposalSnapshot: null,
        purchaseOrderSnapshot: null,
      }),
    ).toThrow(BillingEntitlementError);
  });

  it('PERIODIC/MILESTONE não cobram o contrato inteiro (exigem base por período/marco)', () => {
    // Sem base por período/marco, o valor global do contrato NÃO é usado.
    expect(() =>
      resolveContractualBillingLine({
        policy: BILLING_ENTITLEMENT_POLICIES.Periodic,
        serviceSnapshot: {},
        proposalSnapshot: { globalSalePrice: '12000.0000', currencyCode: 'BRL' },
        purchaseOrderSnapshot: null,
      }),
    ).toThrow(BillingEntitlementError);

    expect(() =>
      resolveContractualBillingLine({
        policy: BILLING_ENTITLEMENT_POLICIES.Milestone,
        serviceSnapshot: {},
        proposalSnapshot: { totalAmount: '12000.0000' },
        purchaseOrderSnapshot: null,
      }),
    ).toThrow(BillingEntitlementError);

    // Com a base explícita, o valor correto é usado.
    expect(
      resolveContractualBillingLine({
        policy: BILLING_ENTITLEMENT_POLICIES.Periodic,
        serviceSnapshot: { periodicAmount: '1000.0000', currencyCode: 'BRL' },
        proposalSnapshot: null,
        purchaseOrderSnapshot: null,
      }).lineAmount,
    ).toBe('1000.0000');

    expect(
      resolveContractualBillingLine({
        policy: BILLING_ENTITLEMENT_POLICIES.Milestone,
        serviceSnapshot: { milestoneAmount: '3000.0000' },
        proposalSnapshot: null,
        purchaseOrderSnapshot: null,
      }).lineAmount,
    ).toBe('3000.0000');
  });

  it('requires a purchase order before billing when the client rule says so', () => {
    expect(() =>
      assertPurchaseOrderRequirement({
        requirement: PURCHASE_ORDER_REQUIREMENTS.BeforeBilling,
        phase: 'BILLING',
        purchaseOrderId: null,
      }),
    ).toThrow(BillingEntitlementError);

    expect(() =>
      assertPurchaseOrderRequirement({
        requirement: PURCHASE_ORDER_REQUIREMENTS.NotRequired,
        phase: 'BILLING',
        purchaseOrderId: null,
      }),
    ).not.toThrow();
  });
});
