import type { IntegrationInboxErrorClass, IntegrationInboxStatus } from './inbox-status';

export type IntegrationInboxRow = {
  id: string;
  provider: string;
  external_message_id: string;
  event_type: string;
  received_at: string;
  payload_hash: string;
  payload: Record<string, unknown>;
  status: IntegrationInboxStatus;
  processed_at: string | null;
  error_classification: IntegrationInboxErrorClass | null;
  attempts: number;
  max_attempts: number;
  run_after: string;
  last_error: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReceiveIntegrationMessageInput = {
  provider: string;
  externalMessageId: string;
  eventType: string;
  payload: Record<string, unknown>;
  receivedAt?: string;
  rawBody?: string;
  signature?: string | null;
  maxAttempts?: number;
};

export type ReceiveIntegrationMessageResult =
  | { outcome: 'created'; inboxId: string }
  | { outcome: 'duplicate'; inboxId: string };

export type InboxProcessContext = {
  inboxId: string;
  provider: string;
  externalMessageId: string;
  eventType: string;
  payload: Record<string, unknown>;
  attempts: number;
  signal: AbortSignal;
};
