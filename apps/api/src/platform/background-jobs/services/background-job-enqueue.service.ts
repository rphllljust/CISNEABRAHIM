import { Injectable } from '@nestjs/common';
import { BACKGROUND_JOB_KINDS } from '../domain/background-job-kind';
import {
  BackgroundJobsRepository,
  type EnqueueBackgroundJobInput,
  type EnqueueBackgroundJobResult,
} from '../repositories/background-jobs.repository';
import { loadWorkerConfig } from '../config/worker.config';

@Injectable()
export class BackgroundJobEnqueueService {
  constructor(private readonly repository: BackgroundJobsRepository) {}

  async enqueue(input: Omit<EnqueueBackgroundJobInput, 'maxAttempts'> & { maxAttempts?: number }): Promise<EnqueueBackgroundJobResult> {
    const config = loadWorkerConfig();
    return this.repository.enqueueJob({
      ...input,
      maxAttempts: input.maxAttempts ?? config.defaultMaxAttempts,
    });
  }

  async enqueueNotificationDispatch(input: {
    notificationIntentId: string;
    domainEventId: string;
    templateKey: string;
    correlationId?: string | null;
  }): Promise<EnqueueBackgroundJobResult> {
    const idempotencyKey = `notification-intent:${input.notificationIntentId}:dispatch`;
    return this.enqueue({
      jobKind: BACKGROUND_JOB_KINDS.Notification,
      idempotencyKey,
      correlationId: input.correlationId ?? null,
      payload: {
        schemaVersion: 1,
        notificationIntentId: input.notificationIntentId,
        domainEventId: input.domainEventId,
        templateKey: input.templateKey,
      },
    });
  }
}
