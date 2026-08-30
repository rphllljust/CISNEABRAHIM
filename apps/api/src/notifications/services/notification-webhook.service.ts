import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';
import type { DeliveryAttemptRow } from '../repositories/notifications.repository';

export type ApplyDeliveryWebhookInput = {
  providerMessageId: string;
  deliveredAt: string;
};

@Injectable()
export class NotificationWebhookService {
  constructor(private readonly repository: NotificationsRepository) {}

  async applyDeliveryUpdate(input: ApplyDeliveryWebhookInput): Promise<DeliveryAttemptRow | null> {
    return this.repository.applyDeliveryUpdate(input.providerMessageId, input.deliveredAt);
  }
}
