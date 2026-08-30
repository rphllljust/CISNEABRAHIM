import { Injectable, Logger } from '@nestjs/common';
import {
  computeInboxBackoffDelayMs,
  loadInboxProcessorConfig,
  type InboxProcessorConfig,
} from '../config/inbox-processor.config';
import {
  INTEGRATION_INBOX_ERROR_CLASSES,
  INTEGRATION_INBOX_STATUSES,
} from '../domain/inbox-status';
import {
  classifyInboxError,
  inboxErrorMessage,
  InvalidInboxPayloadError,
  PermanentInboxError,
} from '../domain/inbox-errors';
import type { IntegrationInboxRow } from '../domain/inbox-message.types';
import { IntegrationInboxRepository } from '../repositories/integration-inbox.repository';
import { IntegrationInboxHandlerRegistry } from './integration-inbox-handler.registry';

@Injectable()
export class IntegrationInboxProcessorService {
  private readonly logger = new Logger(IntegrationInboxProcessorService.name);
  private readonly config: InboxProcessorConfig;

  constructor(
    private readonly repository: IntegrationInboxRepository,
    private readonly handlerRegistry: IntegrationInboxHandlerRegistry,
  ) {
    this.config = loadInboxProcessorConfig();
  }

  getConfig(): InboxProcessorConfig {
    return this.config;
  }

  async processBatch(workerId: string, limit: number): Promise<number> {
    const claimed = await this.repository.claimPending(
      workerId,
      limit,
      this.config.leaseDurationMs,
    );
    for (const message of claimed) {
      await this.processClaimedMessage(message);
    }
    return claimed.length;
  }

  async processClaimedMessage(message: IntegrationInboxRow): Promise<void> {
    const handler = this.handlerRegistry.get(message.event_type);
    if (!handler) {
      await this.repository.markFailed(
        message.id,
        INTEGRATION_INBOX_ERROR_CLASSES.Permanent,
        `NO_HANDLER_FOR_${message.event_type}`,
      );
      this.logger.warn(`Inbox message failed permanently id=${message.id}: no handler`);
      return;
    }

    try {
      handler.validate(message.payload);
    } catch (error) {
      const errorClass = classifyInboxError(error);
      const errorMessage = inboxErrorMessage(error);
      if (errorClass === INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload) {
        await this.repository.markInvalid(message.id, errorClass, errorMessage);
        this.logger.warn(`Inbox message invalid id=${message.id}: ${errorMessage}`);
        return;
      }
      await this.repository.markFailed(message.id, errorClass, errorMessage);
      return;
    }

    const abortController = new AbortController();
    try {
      await handler.handle({
        inboxId: message.id,
        provider: message.provider,
        externalMessageId: message.external_message_id,
        eventType: message.event_type,
        payload: message.payload,
        attempts: message.attempts,
        signal: abortController.signal,
      });
      await this.repository.markProcessed(message.id);
      this.logger.log(
        `Inbox message processed id=${message.id} provider=${message.provider} external=${message.external_message_id}`,
      );
    } catch (error) {
      const errorClass = classifyInboxError(error);
      const errorMessage = inboxErrorMessage(error);

      if (
        errorClass === INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload ||
        error instanceof InvalidInboxPayloadError
      ) {
        await this.repository.markInvalid(
          message.id,
          INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload,
          errorMessage,
        );
        return;
      }

      if (
        errorClass === INTEGRATION_INBOX_ERROR_CLASSES.Permanent ||
        error instanceof PermanentInboxError
      ) {
        await this.repository.markFailed(
          message.id,
          INTEGRATION_INBOX_ERROR_CLASSES.Permanent,
          errorMessage,
        );
        this.logger.warn(`Inbox message failed permanently id=${message.id}: ${errorMessage}`);
        return;
      }

      if (message.attempts >= message.max_attempts) {
        await this.repository.markFailed(
          message.id,
          INTEGRATION_INBOX_ERROR_CLASSES.Transient,
          errorMessage,
        );
        this.logger.warn(
          `Inbox message exhausted retries id=${message.id} attempts=${message.attempts}/${message.max_attempts}: ${errorMessage}`,
        );
        return;
      }

      const delayMs = computeInboxBackoffDelayMs(
        message.attempts,
        this.config.backoffBaseMs,
        this.config.backoffMaxMs,
      );
      const runAfter = new Date(Date.now() + delayMs).toISOString();
      await this.repository.scheduleRetry(
        message.id,
        INTEGRATION_INBOX_ERROR_CLASSES.Transient,
        errorMessage,
        runAfter,
      );
      this.logger.warn(
        `Inbox message scheduled for retry id=${message.id} attempt=${message.attempts}/${message.max_attempts} in ${delayMs}ms: ${errorMessage}`,
      );
    }
  }

  isTerminalStatus(status: string): boolean {
    return (
      status === INTEGRATION_INBOX_STATUSES.Processed ||
      status === INTEGRATION_INBOX_STATUSES.Failed ||
      status === INTEGRATION_INBOX_STATUSES.Invalid
    );
  }
}
