import { Injectable } from '@nestjs/common';
import {
  InvalidInboxPayloadError,
  PermanentInboxError,
  TransientInboxError,
} from '../domain/inbox-errors';
import type { IntegrationInboxHandler } from '../domain/inbox-handler.types';
import { IntegrationInboxRepository } from '../repositories/integration-inbox.repository';

export const TEST_INBOX_EVENT_TYPE = 'test.payment.confirmed';

@Injectable()
export class TestIntegrationInboxHandler implements IntegrationInboxHandler {
  constructor(private readonly repository: IntegrationInboxRepository) {}

  supports(eventType: string): boolean {
    return eventType === TEST_INBOX_EVENT_TYPE;
  }

  validate(payload: Record<string, unknown>): void {
    const amount = payload['amount'];
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new InvalidInboxPayloadError('PAYLOAD_AMOUNT_REQUIRED');
    }
    if (amount <= 0) {
      throw new InvalidInboxPayloadError('PAYLOAD_AMOUNT_POSITIVE_REQUIRED');
    }
  }

  async handle(context: {
    inboxId: string;
    provider: string;
    externalMessageId: string;
    payload: Record<string, unknown>;
    attempts: number;
  }): Promise<void> {
    if (context.payload['_simulateTransientFailure'] === true && context.attempts < 2) {
      throw new TransientInboxError('SIMULATED_TRANSIENT_FAILURE');
    }
    if (context.payload['_simulatePermanentFailure'] === true) {
      throw new PermanentInboxError('SIMULATED_PERMANENT_FAILURE');
    }

    const effectKey = `${context.provider}:${context.externalMessageId}`;
    await this.repository.recordEffect(context.inboxId, effectKey);
  }
}
