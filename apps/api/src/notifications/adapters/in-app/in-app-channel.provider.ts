import { Injectable } from '@nestjs/common';
import { NOTIFICATION_CHANNELS } from '../../domain/notification-channel';
import type {
  NotificationChannelDispatchInput,
  NotificationChannelDispatchResult,
  NotificationChannelProvider,
} from '../../ports/notification-channel.port';

@Injectable()
export class InAppNotificationChannelProvider implements NotificationChannelProvider {
  readonly channel = NOTIFICATION_CHANNELS.InApp;
  readonly providerId = 'in-app';

  async dispatch(input: NotificationChannelDispatchInput): Promise<NotificationChannelDispatchResult> {
    const sentAt = new Date().toISOString();
    return {
      providerMessageId: `in-app:${input.notificationId}:${input.idempotencyKey}`,
      sentAt,
      deliveredAt: sentAt,
    };
  }
}
