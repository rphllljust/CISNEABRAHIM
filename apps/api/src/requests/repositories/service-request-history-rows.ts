import type { PoolClient } from 'pg';

export async function insertServiceRequestHistoryEvent(
  client: PoolClient,
  input: {
    serviceRequestId: string;
    eventType: string;
    actorIdentityId: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO sr.service_request_history_events (
       service_request_id, event_type, actor_identity_id, payload
     )
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      input.serviceRequestId,
      input.eventType,
      input.actorIdentityId,
      JSON.stringify(input.payload ?? {}),
    ],
  );
}
