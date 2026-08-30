import { expect } from 'vitest';
import type { Pool } from 'pg';
import type { MasterBusinessArtifacts } from './master-business-types';

export type TimelineEvent = {
  source: string;
  eventType: string;
  actorIdentityId: string | null;
  occurredAt: Date;
  payload: Record<string, unknown> | null;
};

export async function reconstructBusinessTimeline(
  pool: Pool,
  artifacts: MasterBusinessArtifacts,
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const serviceOrderHistory = await pool.query<{
    event_type: string;
    actor_identity_id: string | null;
    occurred_at: Date;
    payload: Record<string, unknown> | null;
  }>(
    `SELECT event_type, actor_identity_id, occurred_at, payload
     FROM so.service_order_history_events
     WHERE service_order_id = $1
     ORDER BY occurred_at ASC`,
    [artifacts.serviceOrderId],
  );
  for (const row of serviceOrderHistory.rows) {
    events.push({
      source: 'service_order',
      eventType: row.event_type,
      actorIdentityId: row.actor_identity_id,
      occurredAt: row.occurred_at,
      payload: row.payload,
    });
  }

  const measurementHistory = await pool.query<{
    event_type: string;
    actor_identity_id: string | null;
    occurred_at: Date;
    payload: Record<string, unknown> | null;
  }>(
    `SELECT event_type, actor_identity_id, occurred_at, payload
     FROM msr.measurement_history_events
     WHERE measurement_id = $1
     ORDER BY occurred_at ASC`,
    [artifacts.measurementId],
  );
  for (const row of measurementHistory.rows) {
    events.push({
      source: 'measurement',
      eventType: row.event_type,
      actorIdentityId: row.actor_identity_id,
      occurredAt: row.occurred_at,
      payload: row.payload,
    });
  }

  const billingHistory = await pool.query<{
    event_type: string;
    actor_identity_id: string | null;
    occurred_at: Date;
    payload: Record<string, unknown> | null;
  }>(
    `SELECT event_type, actor_identity_id, occurred_at, payload
     FROM bil.billing_history_events
     WHERE billing_record_id = $1
     ORDER BY occurred_at ASC`,
    [artifacts.billingRecordId],
  );
  for (const row of billingHistory.rows) {
    events.push({
      source: 'billing',
      eventType: row.event_type,
      actorIdentityId: row.actor_identity_id,
      occurredAt: row.occurred_at,
      payload: row.payload,
    });
  }

  const documentHistory = await pool.query<{
    event_type: string;
    actor_identity_id: string | null;
    occurred_at: Date;
    payload: Record<string, unknown> | null;
  }>(
    `SELECT event_type, actor_identity_id, occurred_at, payload
     FROM bil.billing_document_history_events
     WHERE billing_document_id = $1
     ORDER BY occurred_at ASC`,
    [artifacts.billingDocumentId],
  );
  for (const row of documentHistory.rows) {
    events.push({
      source: 'billing_document',
      eventType: row.event_type,
      actorIdentityId: row.actor_identity_id,
      occurredAt: row.occurred_at,
      payload: row.payload,
    });
  }

  const auditEvents = await pool.query<{
    action: string;
    actor_identity_id: string | null;
    occurred_at: Date;
    metadata: Record<string, unknown> | null;
    resource_id: string | null;
  }>(
    `SELECT action, actor_identity_id, occurred_at, metadata, resource_id
     FROM audit.security_audit_events
     WHERE resource_id IN ($1, $2, $3, $4)
     ORDER BY occurred_at ASC`,
    [artifacts.serviceOrderId, artifacts.measurementId, artifacts.billingRecordId, artifacts.billingDocumentId],
  );
  for (const row of auditEvents.rows) {
    events.push({
      source: 'security_audit',
      eventType: row.action,
      actorIdentityId: row.actor_identity_id,
      occurredAt: row.occurred_at,
      payload: row.metadata,
    });
  }

  events.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
  return events;
}

export function assertTimelineIntegrity(events: TimelineEvent[], actorIdentityId: string): void {
  expect(events.length).toBeGreaterThan(0);

  const serviceOrderEvents = events.filter((event) => event.source === 'service_order');
  expect(serviceOrderEvents.map((event) => event.eventType)).toEqual(
    expect.arrayContaining(['PREPARED', 'RELEASED']),
  );

  const measurementEvents = events.filter((event) => event.source === 'measurement');
  expect(measurementEvents.map((event) => event.eventType)).toEqual(
    expect.arrayContaining(['CREATED', 'SUBMITTED', 'APPROVED']),
  );

  const billingEvents = events.filter((event) => event.source === 'billing');
  expect(billingEvents.map((event) => event.eventType)).toContain('PREPARED');

  const documentEvents = events.filter((event) => event.source === 'billing_document');
  expect(documentEvents.length).toBeGreaterThan(0);

  for (const event of events) {
    if (event.actorIdentityId) {
      expect(event.actorIdentityId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  }

  const actorEvents = events.filter((event) => event.actorIdentityId === actorIdentityId);
  expect(actorEvents.length).toBeGreaterThan(0);

  const syntheticFabricated = events.filter(
    (event) => event.eventType === 'SYNTHETIC_TEST_FABRICATION' || event.eventType === 'INVENTED_EVENT',
  );
  expect(syntheticFabricated).toHaveLength(0);
}
