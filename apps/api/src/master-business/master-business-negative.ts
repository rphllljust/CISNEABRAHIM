import { expect } from 'vitest';
import type { Pool } from 'pg';
import { BILLING_ERROR_CODES } from '../billing/errors/billing-error-codes';
import { REQUESTS_ERROR_CODES } from '../requests/errors/requests-error-codes';
import { SERVICE_ORDERS_ERROR_CODES } from '../service-orders/errors/service-orders-error-codes';
import type { UatActor, UatVerticalServices } from '../uat/uat-vertical-runner';
import { runUatVerticalScenario } from '../uat/uat-vertical-runner';
import { UAT_SCENARIOS } from '../uat/uat-scenarios';

async function assertNoPartialServiceOrder(pool: Pool, serviceOrderId: string, expectedStatus: string): Promise<void> {
  const row = await pool.query<{ status: string }>(`SELECT status FROM so.service_orders WHERE id = $1`, [
    serviceOrderId,
  ]);
  expect(row.rows[0]?.status).toBe(expectedStatus);
}

export async function runNegativeJourneyChecks(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  await negativeInactiveClientRelease(services, actor, unitId);
  await negativeRejectedRequestConvert(services, actor, unitId);
  await negativeCancelledOrderStart(services, actor, unitId);
  await negativeCompletedOrderExecution(services, actor, unitId);
  await negativeRejectedMeasurementBilling(services, actor, unitId);
  await negativeMissingBillingNotaFatura(services, actor, unitId);
}

async function negativeInactiveClientRelease(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  const partial = await runUatVerticalScenario(services, UAT_SCENARIOS[0]!, actor, unitId, {
    stopAfter: 'prepared',
  });
  const order = await services.serviceOrdersAccess.getById(actor, partial.serviceOrderId!);
  const client = await services.clientAccess.getById(actor, order.clientId!);
  await services.clientAccess.deactivate(actor, client.id, client.version, 'Inactive for negative test');

  await expect(
    services.serviceOrdersAccess.release(actor, order.id, { rowVersion: order.rowVersion }),
  ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.CLIENT_INACTIVE });

  await assertNoPartialServiceOrder(services.pool, order.id, 'PREPARED');
}

async function negativeRejectedRequestConvert(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  const scenario = UAT_SCENARIOS[1]!;
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const { buildSyntheticUatClient } = await import('./synthetic-test-data');
  const synthetic = buildSyntheticUatClient(scenario.id, suffix);
  const { CONTACT_PURPOSES } = await import('../clients/domain/client-status');
  const { SERVICE_REQUEST_ORIGINS } = await import('../requests/domain/service-request');

  const client = await services.clientAccess.create(actor, {
    legalName: synthetic.legalName,
    taxId: synthetic.taxId,
    contacts: [{ name: synthetic.contactName, purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
  });

  const request = await services.serviceRequestsAccess.create(actor, {
    unitId,
    originSource: SERVICE_REQUEST_ORIGINS.Email,
    clientId: client.id,
    description: scenario.requestDescription,
  });
  const submitted = await services.serviceRequestsAccess.submit(actor, request.serviceRequest.id, {
    rowVersion: request.serviceRequest.rowVersion,
  });
  const reviewed = await services.serviceRequestsAccess.startReview(actor, request.serviceRequest.id, {
    rowVersion: submitted.serviceRequest.rowVersion,
  });
  const rejected = await services.serviceRequestsAccess.reject(actor, request.serviceRequest.id, {
    rowVersion: reviewed.serviceRequest.rowVersion,
    rejectionReason: 'Synthetic negative journey',
  });

  await expect(
    services.serviceRequestsAccess.convert(actor, request.serviceRequest.id, {
      rowVersion: rejected.serviceRequest.rowVersion,
    }),
  ).rejects.toMatchObject({ code: REQUESTS_ERROR_CODES.INVALID_STATE });

  const row = await services.pool.query<{ status: string; converted_service_order_id: string | null }>(
    `SELECT status, converted_service_order_id FROM sr.service_requests WHERE id = $1`,
    [request.serviceRequest.id],
  );
  expect(row.rows[0]?.status).toBe('REJECTED');
  expect(row.rows[0]?.converted_service_order_id).toBeNull();
}

async function negativeCancelledOrderStart(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  const partial = await runUatVerticalScenario(services, UAT_SCENARIOS[0]!, actor, unitId, {
    stopAfter: 'released',
  });
  const order = await services.serviceOrdersAccess.getById(actor, partial.serviceOrderId!);
  const cancelled = await services.serviceOrdersAccess.cancel(actor, order.id, {
    rowVersion: order.rowVersion,
    cancellationReason: 'Synthetic negative journey',
  });

  await expect(
    services.executionAccess.start(actor, cancelled.id, { rowVersion: cancelled.rowVersion }),
  ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.INVALID_STATE });

  await assertNoPartialServiceOrder(services.pool, cancelled.id, 'CANCELLED');
}

async function negativeCompletedOrderExecution(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  const completed = await runUatVerticalScenario(services, UAT_SCENARIOS[2]!, actor, unitId, {
    stopAfter: 'measurement_approved',
  });
  const order = await services.serviceOrdersAccess.getById(actor, completed.serviceOrderId!);

  await expect(
    services.executionAccess.recordQuantity(actor, order.id, {
      rowVersion: order.rowVersion,
      quantityValue: '99',
      unitCode: 'SERVICE',
    }),
  ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.INVALID_STATE });

  await assertNoPartialServiceOrder(services.pool, order.id, 'COMPLETED');
}

async function negativeRejectedMeasurementBilling(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  const partial = await runUatVerticalScenario(services, UAT_SCENARIOS[0]!, actor, unitId, {
    stopAfter: 'completed_execution',
  });
  const measurement = await services.measurementsAccess.create(actor, partial.serviceOrderId!);
  const submitted = await services.measurementsAccess.submit(actor, partial.serviceOrderId!, measurement.id, {
    rowVersion: measurement.rowVersion,
  });
  const reviewed = await services.measurementsAccess.startReview(actor, partial.serviceOrderId!, measurement.id, {
    rowVersion: submitted.rowVersion,
  });
  const rejected = await services.measurementsAccess.reject(actor, partial.serviceOrderId!, measurement.id, {
    rowVersion: reviewed.rowVersion,
    rejectionReason: 'Synthetic negative journey',
  });

  await expect(
    services.billingAccess.prepare(actor, partial.serviceOrderId!, {
      measurementId: rejected.id,
      paymentTerms: '30 DDL',
    }),
  ).rejects.toMatchObject({ code: BILLING_ERROR_CODES.MEASUREMENT_NOT_APPROVED });

  const billingCount = await services.pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE service_order_id = $1`,
    [partial.serviceOrderId],
  );
  expect(billingCount.rows[0]?.count).toBe('0');
}

async function negativeMissingBillingNotaFatura(
  services: UatVerticalServices,
  actor: UatActor,
  unitId: string,
): Promise<void> {
  const partial = await runUatVerticalScenario(services, UAT_SCENARIOS[1]!, actor, unitId, {
    stopAfter: 'measurement_approved',
  });
  const fakeBillingId = crypto.randomUUID();

  await expect(
    services.billingDocumentAccess.issue(actor, partial.serviceOrderId!, fakeBillingId, {
      dueDate: '2026-10-31',
    }),
  ).rejects.toMatchObject({ code: BILLING_ERROR_CODES.NOT_FOUND });

  const docCount = await services.pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE service_order_id = $1`,
    [partial.serviceOrderId],
  );
  expect(docCount.rows[0]?.count).toBe('0');
}
