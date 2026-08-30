import { Injectable, Logger } from '@nestjs/common';
import {
  assertAuthorizationIndependentPayload,
  buildBillingReadyPayloadV1,
  buildMeasurementApprovedPayloadV1,
  buildMeasurementSubmittedPayloadV1,
  buildPaymentOverduePayloadV1,
  buildServiceOrderAssignedPayloadV1,
  buildServiceOrderCompletedPayloadV1,
  buildServiceOrderReleasedPayloadV1,
  buildServiceRequestSubmittedPayloadV1,
} from '../domain/event-payloads.v1';
import { AGGREGATE_TYPES } from '../domain/domain-event-type';
import { DOMAIN_EVENT_TYPES } from '../domain/domain-event-type';
import { DomainEventsRepository } from '../repositories/domain-events.repository';

@Injectable()
export class DomainEventsRecorderService {
  private readonly logger = new Logger(DomainEventsRecorderService.name);

  constructor(private readonly repository: DomainEventsRepository) {}

  async recordServiceRequestSubmitted(input: {
    serviceRequestId: string;
    unitId: string;
    clientId: string | null;
    submittedAt: string;
  }): Promise<void> {
    const payload = buildServiceRequestSubmittedPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
      aggregateType: AGGREGATE_TYPES.ServiceRequest,
      aggregateId: input.serviceRequestId,
      payload,
      occurredAt: input.submittedAt,
      idempotencyKey: `service-request:${input.serviceRequestId}:submitted`,
    });
  }

  async recordServiceOrderReleased(input: {
    serviceOrderId: string;
    unitId: string;
    clientId: string | null;
    orderNumber: string;
    releasedAt: string;
  }): Promise<void> {
    const payload = buildServiceOrderReleasedPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.ServiceOrderReleased,
      aggregateType: AGGREGATE_TYPES.ServiceOrder,
      aggregateId: input.serviceOrderId,
      payload,
      occurredAt: input.releasedAt,
      idempotencyKey: `service-order:${input.serviceOrderId}:released`,
    });
  }

  async recordServiceOrderAssigned(input: {
    serviceOrderId: string;
    unitId: string;
    allocationId: string;
    physicalAssetId: string;
    resourceTypeCode: string;
    assignedAt: string;
  }): Promise<void> {
    const payload = buildServiceOrderAssignedPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.ServiceOrderAssigned,
      aggregateType: AGGREGATE_TYPES.ServiceOrder,
      aggregateId: input.serviceOrderId,
      payload,
      occurredAt: input.assignedAt,
      idempotencyKey: `service-order:${input.serviceOrderId}:allocation:${input.allocationId}`,
    });
  }

  async recordServiceOrderCompleted(input: {
    serviceOrderId: string;
    unitId: string;
    clientId: string | null;
    orderNumber: string;
    completedAt: string;
  }): Promise<void> {
    const payload = buildServiceOrderCompletedPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.ServiceOrderCompleted,
      aggregateType: AGGREGATE_TYPES.ServiceOrder,
      aggregateId: input.serviceOrderId,
      payload,
      occurredAt: input.completedAt,
      idempotencyKey: `service-order:${input.serviceOrderId}:completed`,
    });
  }

  async recordMeasurementSubmitted(input: {
    measurementId: string;
    serviceOrderId: string;
    unitId: string;
    submittedAt: string;
  }): Promise<void> {
    const payload = buildMeasurementSubmittedPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.MeasurementSubmitted,
      aggregateType: AGGREGATE_TYPES.Measurement,
      aggregateId: input.measurementId,
      payload,
      occurredAt: input.submittedAt,
      idempotencyKey: `measurement:${input.measurementId}:submitted`,
    });
  }

  async recordMeasurementApproved(input: {
    measurementId: string;
    serviceOrderId: string;
    unitId: string;
    approvedAt: string;
  }): Promise<void> {
    const payload = buildMeasurementApprovedPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.MeasurementApproved,
      aggregateType: AGGREGATE_TYPES.Measurement,
      aggregateId: input.measurementId,
      payload,
      occurredAt: input.approvedAt,
      idempotencyKey: `measurement:${input.measurementId}:approved`,
    });
  }

  async recordBillingReady(input: {
    billingRecordId: string;
    serviceOrderId: string;
    measurementId: string;
    unitId: string;
    totalAmount: string;
    preparedAt: string;
  }): Promise<void> {
    const payload = buildBillingReadyPayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.BillingReady,
      aggregateType: AGGREGATE_TYPES.BillingRecord,
      aggregateId: input.billingRecordId,
      payload,
      occurredAt: input.preparedAt,
      idempotencyKey: `billing-record:${input.billingRecordId}:ready`,
    });
  }

  async recordPaymentOverdue(input: {
    billingDocumentId: string;
    billingRecordId: string;
    serviceOrderId: string;
    unitId: string;
    documentNumber: string;
    dueDate: string;
    overdueDetectedAt: string;
  }): Promise<void> {
    const payload = buildPaymentOverduePayloadV1(input);
    await this.record({
      eventType: DOMAIN_EVENT_TYPES.PaymentOverdue,
      aggregateType: AGGREGATE_TYPES.BillingDocument,
      aggregateId: input.billingDocumentId,
      payload,
      occurredAt: input.overdueDetectedAt,
      idempotencyKey: `billing-document:${input.billingDocumentId}:payment-overdue`,
    });
  }

  private async record(input: {
    eventType: (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    occurredAt: string;
    idempotencyKey: string;
  }): Promise<void> {
    try {
      assertAuthorizationIndependentPayload(input.payload);
      await this.repository.recordDomainEvent({
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        payload: input.payload,
        occurredAt: input.occurredAt,
        idempotencyKey: input.idempotencyKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      this.logger.warn(`Domain event persistence skipped for ${input.eventType}: ${message}`);
    }
  }
}
