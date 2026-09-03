import type { CollectionAggregate } from '../repositories/collections.repository';
import type { CollectionHistoryRow } from '../repositories/collections.repository.types';

export type CollectionResponse = {
  id: string;
  receivableId: string;
  unitId: string;
  clientId: string;
  status: string;
  openedBecauseOverdue: boolean;
  promisedDueDate: string | null;
  version: number;
  openedAt: string;
  closedAt: string | null;
  actions: Array<{
    id: string;
    kind: string;
    notes: string | null;
    actorIdentityId: string;
    occurredAt: string;
  }>;
  promises: Array<{
    id: string;
    promisedAmount: string;
    promisedOn: string;
    status: string;
  }>;
  history: Array<{
    id: string;
    eventKind: string;
    payload: Record<string, unknown>;
    actorIdentityId: string;
    occurredAt: string;
  }>;
};

function dateOnly(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

export function toCollectionResponse(aggregate: CollectionAggregate): CollectionResponse {
  return {
    id: aggregate.collection.id,
    receivableId: aggregate.collection.receivable_id,
    unitId: aggregate.collection.unit_id,
    clientId: aggregate.collection.client_id,
    status: aggregate.collection.status,
    openedBecauseOverdue: aggregate.collection.opened_because_overdue,
    promisedDueDate: dateOnly(aggregate.collection.promised_due_date),
    version: aggregate.collection.version,
    openedAt: aggregate.collection.opened_at,
    closedAt: aggregate.collection.closed_at,
    actions: aggregate.actions.map((action) => ({
      id: action.id,
      kind: action.kind,
      notes: action.notes,
      actorIdentityId: action.actor_identity_id,
      occurredAt: action.occurred_at,
    })),
    promises: aggregate.promises.map((item) => ({
      id: item.id,
      promisedAmount: item.promised_amount,
      promisedOn: dateOnly(item.promised_on) ?? item.promised_on,
      status: item.status,
    })),
    history: aggregate.history.map((item) => toHistoryItem(item)),
  };
}

export function toHistoryItem(item: CollectionHistoryRow) {
  return {
    id: item.id,
    eventKind: item.event_kind,
    payload: item.payload,
    actorIdentityId: item.actor_identity_id,
    occurredAt: item.occurred_at,
  };
}
