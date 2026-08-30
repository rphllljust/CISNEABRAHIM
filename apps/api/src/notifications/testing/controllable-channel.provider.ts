import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../integrations/acl/domain/integration-error';
import { NOTIFICATION_CHANNELS, type NotificationChannel } from '../domain/notification-channel';
import type {
  NotificationChannelDispatchInput,
  NotificationChannelDispatchResult,
  NotificationChannelProvider,
} from '../ports/notification-channel.port';

export type ControllableChannelBehavior =
  | 'success'
  | 'transient'
  | 'permanent'
  | 'timeout'
  | 'duplicate';

export class ControllableNotificationChannelProvider implements NotificationChannelProvider {
  readonly providerId: string;
  behavior: ControllableChannelBehavior = 'success';
  dispatchCount = 0;
  lastIdempotencyKey: string | null = null;
  fixedProviderMessageId: string | null = null;
  private readonly acceptedMessages = new Map<string, NotificationChannelDispatchResult>();

  constructor(
    readonly channel: NotificationChannel,
    providerId?: string,
  ) {
    this.providerId = providerId ?? `test-${channel.toLowerCase()}`;
  }

  seedAcceptedMessage(
    idempotencyKey: string,
    result: NotificationChannelDispatchResult,
  ): void {
    this.acceptedMessages.set(idempotencyKey, result);
  }

  async dispatch(input: NotificationChannelDispatchInput): Promise<NotificationChannelDispatchResult> {
    this.dispatchCount += 1;
    this.lastIdempotencyKey = input.idempotencyKey;

    const cached = this.acceptedMessages.get(input.idempotencyKey);
    if (cached) {
      return cached;
    }

    if (this.behavior === 'duplicate' && this.fixedProviderMessageId) {
      return {
        providerMessageId: this.fixedProviderMessageId,
        sentAt: new Date().toISOString(),
      };
    }

    if (this.behavior === 'transient') {
      throw new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Transient, 'SIMULATED_TRANSIENT');
    }
    if (this.behavior === 'permanent') {
      throw new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Permanent, 'SIMULATED_PERMANENT');
    }
    if (this.behavior === 'timeout') {
      throw new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Timeout, 'SIMULATED_TIMEOUT');
    }

    const sentAt = new Date().toISOString();
    return {
      providerMessageId: this.fixedProviderMessageId ?? `${this.providerId}:${input.notificationId}`,
      sentAt,
      deliveredAt: this.channel === NOTIFICATION_CHANNELS.InApp ? sentAt : undefined,
    };
  }
}
