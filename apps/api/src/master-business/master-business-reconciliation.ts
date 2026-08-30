import { expect } from 'vitest';
import type { BillingAccessService } from '../billing/services/billing-access.service';
import type { BillingDocumentAccessService } from '../billing/services/billing-document-access.service';
import type { MeasurementsAccessService } from '../measurements/services/measurements-access.service';
import type { ServiceOrderExecutionAccessService } from '../service-orders/services/service-order-execution-access.service';
import type { ServiceOrdersAccessService } from '../service-orders/services/service-orders-access.service';
import type { MasterBusinessArtifacts } from './master-business-types';
import type { UatActor } from '../uat/uat-vertical-runner';

function parseDecimal(value: string): bigint {
  const normalized = value.replace(/,/g, '').trim();
  const [whole = '0', fraction = ''] = normalized.split('.');
  const paddedFraction = (fraction + '0000').slice(0, 4);
  return BigInt(whole) * 10_000n + BigInt(paddedFraction);
}

export async function assertFinancialReconciliation(
  services: {
    serviceOrdersAccess: ServiceOrdersAccessService;
    executionAccess: ServiceOrderExecutionAccessService;
    measurementsAccess: MeasurementsAccessService;
    billingAccess: BillingAccessService;
    billingDocumentAccess: BillingDocumentAccessService;
  },
  actor: UatActor,
  artifacts: MasterBusinessArtifacts,
): Promise<void> {
  const order = await services.serviceOrdersAccess.getById(actor, artifacts.serviceOrderId);
  const execution = await services.executionAccess.getExecution(actor, artifacts.serviceOrderId);
  const measurement = await services.measurementsAccess.getById(
    actor,
    artifacts.serviceOrderId,
    artifacts.measurementId,
  );
  const billing = await services.billingAccess.getById(actor, artifacts.serviceOrderId, artifacts.billingRecordId);
  const notaFatura = await services.billingDocumentAccess.getById(
    actor,
    artifacts.serviceOrderId,
    artifacts.billingRecordId,
    artifacts.billingDocumentId,
  );

  const quantityEntries = execution.entries.filter((entry) => entry.entryType === 'QUANTITY');
  expect(quantityEntries.length).toBeGreaterThan(0);

  let executionQuantity = 0n;
  for (const entry of quantityEntries) {
    executionQuantity += parseDecimal(entry.quantityValue ?? '0');
  }

  let measurementQuantity = 0n;
  let measurementAmount = 0n;
  for (const item of measurement.items) {
    measurementQuantity += parseDecimal(item.measuredQuantity);
    if (item.lineAmount) {
      measurementAmount += parseDecimal(item.lineAmount);
    }
  }

  let billingAmount = 0n;
  for (const item of billing.items) {
    billingAmount += parseDecimal(item.lineAmount);
  }

  expect(executionQuantity).toBeGreaterThan(0n);
  expect(measurementQuantity).toBe(executionQuantity);
  expect(measurementAmount).toBeGreaterThan(0n);
  expect(measurementAmount).toBe(billingAmount);
  expect(parseDecimal(billing.totalAmount)).toBe(billingAmount);
  expect(parseDecimal(notaFatura.totalAmount)).toBe(billingAmount);
  expect(billingAmount).toBeGreaterThan(0n);
  expect(order.status).toBe('COMPLETED');

  const billingLineSum = billing.items.reduce((sum, item) => sum + parseDecimal(item.lineAmount), 0n);
  expect(parseDecimal(billing.totalAmount)).toBe(billingLineSum);
}
