import type { DomainEventType } from '../../../events/domain/domain-event-type';

export type OutboxEventRow = {
  id: string;
  event_type: DomainEventType;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  payload_version: number;
  occurred_at: string;
  available_at: string;
  attempts: number;
  max_attempts: number;
  status: string;
  idempotency_key: string;
  ordering_key: string;
  sequence_number: number;
  lease_owner: string | null;
  lease_expires_at: string | null;
  published_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type AppendOutboxEventInput = {
  eventType: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  idempotencyKey: string;
  availableAt?: string;
};
