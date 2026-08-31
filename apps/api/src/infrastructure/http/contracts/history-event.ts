export type HistoryEventResponse = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type HistoryEventRowLike = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  actor_identity_id: string | null;
  occurred_at: string;
};

export function toHistoryEventResponse(row: HistoryEventRowLike): HistoryEventResponse {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    occurredAt: row.occurred_at,
  };
}