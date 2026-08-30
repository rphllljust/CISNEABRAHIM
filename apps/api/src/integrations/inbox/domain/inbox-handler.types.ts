import type { InboxProcessContext } from './inbox-message.types';

export interface IntegrationInboxHandler {
  supports(eventType: string): boolean;
  validate(payload: Record<string, unknown>): void;
  handle(context: InboxProcessContext): Promise<void>;
}
