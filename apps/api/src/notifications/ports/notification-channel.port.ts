import type { NotificationChannel } from '../domain/notification-channel';

export type NotificationChannelDispatchInput = {
  notificationId: string;
  recipientRef: string;
  templateKey: string;
  variables: Record<string, string>;
  idempotencyKey: string;
  signal?: AbortSignal;
};

export type NotificationChannelDispatchResult = {
  providerMessageId: string;
  sentAt: string;
  deliveredAt?: string;
};

export interface NotificationChannelProvider {
  readonly channel: NotificationChannel;
  readonly providerId: string;
  dispatch(input: NotificationChannelDispatchInput): Promise<NotificationChannelDispatchResult>;
}

export const NOTIFICATION_CHANNEL_PROVIDERS = Symbol('NOTIFICATION_CHANNEL_PROVIDERS');
