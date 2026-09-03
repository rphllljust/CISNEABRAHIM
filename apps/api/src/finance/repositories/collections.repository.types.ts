export type CollectionCaseRow = {
  id: string;
  receivable_id: string;
  unit_id: string;
  client_id: string;
  status: string;
  opened_because_overdue: boolean;
  promised_due_date: string | null;
  version: number;
  opened_at: string;
  closed_at: string | null;
  opened_by_identity_id: string;
  closed_by_identity_id: string | null;
};

export type CollectionActionRow = {
  id: string;
  collection_id: string;
  kind: string;
  notes: string | null;
  actor_identity_id: string;
  occurred_at: string;
  idempotency_key: string;
};

export type CollectionPromiseRow = {
  id: string;
  collection_id: string;
  action_id: string;
  promised_amount: string;
  promised_on: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

export type CollectionHistoryRow = {
  id: string;
  collection_id: string;
  event_kind: string;
  payload: Record<string, unknown>;
  actor_identity_id: string;
  occurred_at: string;
};

export type OpenCollectionPersistenceInput = {
  receivableId: string;
  unitId: string;
  clientId: string;
  actorIdentityId: string;
};

export type RecordActionPersistenceInput = {
  collectionId: string;
  kind: string;
  notes: string | null;
  idempotencyKey: string;
  actorIdentityId: string;
};

export type RecordPromisePersistenceInput = {
  collectionId: string;
  promisedAmount: string;
  promisedOn: string;
  notes: string | null;
  idempotencyKey: string;
  actorIdentityId: string;
};

export type RenegotiatePersistenceInput = {
  collectionId: string;
  expectedVersion: number;
  promisedDueDate: string;
  promisedAmount: string | null;
  promisedOn: string | null;
  notes: string | null;
  idempotencyKey: string;
  actorIdentityId: string;
};
