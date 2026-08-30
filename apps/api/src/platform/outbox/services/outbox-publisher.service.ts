import { Injectable, Logger } from '@nestjs/common';
import { DomainEventsRepository } from '../../../events/repositories/domain-events.repository';
import { BackgroundJobEnqueueService } from '../../background-jobs/services/background-job-enqueue.service';
import {
  computeOutboxBackoffDelayMs,
  loadOutboxPublisherConfig,
  type OutboxPublisherConfig,
} from '../config/outbox-publisher.config';
import { OUTBOX_EVENT_STATUSES } from '../domain/outbox-status';
import type { OutboxEventRow } from '../domain/outbox-event.types';
import { OutboxRepository } from '../repositories/outbox.repository';

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private readonly config: OutboxPublisherConfig;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly domainEventsRepository: DomainEventsRepository,
    private readonly backgroundJobEnqueueService: BackgroundJobEnqueueService,
  ) {
    this.config = loadOutboxPublisherConfig();
  }

  async publishClaimedEvent(event: OutboxEventRow): Promise<void> {
    try {
      const publishResult = await this.domainEventsRepository.recordDomainEvent({
        eventType: event.event_type,
        aggregateType: event.aggregate_type,
        aggregateId: event.aggregate_id,
        payload: event.payload,
        occurredAt: event.occurred_at,
        idempotencyKey: event.idempotency_key,
      });

      for (const notificationIntentId of publishResult.notificationIntentIds) {
        const intents = await this.domainEventsRepository.listNotificationIntents(
          publishResult.domainEventId,
        );
        const intent = intents.find((row) => row.id === notificationIntentId);
        if (!intent) {
          continue;
        }
        await this.backgroundJobEnqueueService.enqueueNotificationDispatch({
          notificationIntentId: intent.id,
          domainEventId: publishResult.domainEventId,
          templateKey: intent.template_key,
        });
      }

      await this.outboxRepository.markPublished(event.id);
      this.logger.log(`Outbox event published id=${event.id} type=${event.event_type}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (event.attempts >= event.max_attempts) {
        await this.outboxRepository.markFailed(event.id, message);
        this.logger.warn(`Outbox event failed permanently id=${event.id}: ${message}`);
        return;
      }
      const delayMs = computeOutboxBackoffDelayMs(
        event.attempts,
        this.config.backoffBaseMs,
        this.config.backoffMaxMs,
      );
      const runAfter = new Date(Date.now() + delayMs).toISOString();
      await this.outboxRepository.scheduleRetry(event.id, message, runAfter);
      this.logger.warn(
        `Outbox event scheduled for retry id=${event.id} attempt=${event.attempts}/${event.max_attempts}: ${message}`,
      );
    }
  }

  async publishBatch(workerId: string, limit: number): Promise<number> {
    const claimed = await this.outboxRepository.claimPending(
      workerId,
      limit,
      this.config.leaseDurationMs,
    );
    for (const event of claimed) {
      await this.publishClaimedEvent(event);
    }
    return claimed.length;
  }

  getConfig(): OutboxPublisherConfig {
    return this.config;
  }

  getStatusLabel(status: string): string {
    return status === OUTBOX_EVENT_STATUSES.Published ? 'published' : status.toLowerCase();
  }
}
