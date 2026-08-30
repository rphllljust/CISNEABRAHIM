import { Injectable, Logger } from '@nestjs/common';
import type { BackgroundJobHandler, JobHandlerContext } from '../domain/job-handler.types';
import { PermanentJobError } from '../domain/job-errors';
import { BACKGROUND_JOB_KINDS } from '../domain/background-job-kind';
import { NotificationDeliveryService } from '../../../notifications/services/notification-delivery.service';

@Injectable()
export class NotificationDispatchJobHandler implements BackgroundJobHandler {
  readonly jobKind = BACKGROUND_JOB_KINDS.Notification;
  private readonly logger = new Logger(NotificationDispatchJobHandler.name);

  constructor(private readonly notificationDeliveryService: NotificationDeliveryService) {}

  async handle(context: JobHandlerContext): Promise<void> {
    const notificationIntentId = context.payload['notificationIntentId'];
    if (typeof notificationIntentId !== 'string' || notificationIntentId.length === 0) {
      throw new PermanentJobError('NOTIFICATION_INTENT_ID_REQUIRED');
    }

    const result = await this.notificationDeliveryService.dispatchNotificationIntent(
      notificationIntentId,
    );
    this.logger.log(
      `Notification intent processed id=${notificationIntentId} channels=${result.channelsAttempted.join(',') || 'none'} alreadyDispatched=${result.alreadyDispatched}`,
    );
  }
}
