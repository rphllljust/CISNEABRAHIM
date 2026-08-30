import { Injectable, Logger } from '@nestjs/common';
import {
  classifyIntegrationError,
  INTEGRATION_ERROR_CLASSES,
  isIntegrationProviderError,
  isRetryableIntegrationError,
} from '../../integrations/acl/domain/integration-error';
import { executeProviderCall } from '../../integrations/acl/resilience/provider-executor';
import { PermanentJobError, TransientJobError } from '../../platform/background-jobs/domain/job-errors';
import { loadNotificationChannelCapabilities, loadNotificationDispatchTimeoutMs } from '../config/notification-channel.config';
import {
  DELIVERY_ATTEMPT_STATUS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  type NotificationChannel,
} from '../domain/notification-channel';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationChannelRegistry } from './notification-channel.registry';
import {
  NotificationTemplateService,
  resolveEnabledChannels,
  type NotificationIntentContext,
} from './notification-template.service';

export type DispatchNotificationIntentResult = {
  notificationIntentId: string;
  channelsAttempted: NotificationChannel[];
  alreadyDispatched: boolean;
};

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly channelRegistry: NotificationChannelRegistry,
    private readonly templateService: NotificationTemplateService,
  ) {}

  async dispatchNotificationIntent(notificationIntentId: string): Promise<DispatchNotificationIntentResult> {
    const intent = await this.repository.findIntentById(notificationIntentId);
    if (!intent) {
      throw new PermanentJobError('NOTIFICATION_INTENT_NOT_FOUND');
    }
    if (intent.status === 'DISPATCHED') {
      this.logger.log(`Notification intent already dispatched id=${notificationIntentId}`);
      return {
        notificationIntentId,
        channelsAttempted: [],
        alreadyDispatched: true,
      };
    }
    if (intent.status !== 'PENDING') {
      throw new PermanentJobError('NOTIFICATION_INTENT_NOT_PENDING');
    }

    const capabilities = loadNotificationChannelCapabilities();
    const channels = resolveEnabledChannels(capabilities);
    if (channels.length === 0) {
      throw new PermanentJobError('NO_NOTIFICATION_CHANNELS_AVAILABLE');
    }

    const intentContext: NotificationIntentContext = {
      intentKey: intent.intent_key,
      audienceScope: intent.audience_scope,
      templateKey: intent.template_key,
      payload: intent.payload,
    };

    const variables = this.templateService.buildMinimalVariables(intentContext);
    const transientFailures: string[] = [];

    for (const channel of channels) {
      try {
        await this.dispatchToChannel(notificationIntentId, channel, intentContext, variables);
      } catch (error) {
        if (error instanceof TransientJobError) {
          transientFailures.push(channel);
          continue;
        }
        if (error instanceof PermanentJobError) {
          this.logger.warn(
            `Permanent notification failure intent=${notificationIntentId} channel=${channel}: ${error.message}`,
          );
          continue;
        }
        throw error;
      }
    }

    if (transientFailures.length > 0) {
      throw new TransientJobError(
        `NOTIFICATION_TRANSIENT_FAILURE:${transientFailures.join(',')}`,
      );
    }

    const marked = await this.repository.markIntentDispatched(notificationIntentId);
    if (!marked) {
      const refreshed = await this.repository.findIntentById(notificationIntentId);
      if (refreshed?.status === 'DISPATCHED') {
        return {
          notificationIntentId,
          channelsAttempted: channels,
          alreadyDispatched: true,
        };
      }
      throw new PermanentJobError('NOTIFICATION_INTENT_DISPATCH_UPDATE_FAILED');
    }

    return {
      notificationIntentId,
      channelsAttempted: channels,
      alreadyDispatched: false,
    };
  }

  private async dispatchToChannel(
    notificationIntentId: string,
    channel: NotificationChannel,
    intentContext: NotificationIntentContext,
    variables: Record<string, string>,
  ): Promise<void> {
    const recipientRef = this.templateService.resolveRecipientRef(channel, intentContext);
    if (!this.templateService.isValidRecipient(channel, recipientRef)) {
      const notification = await this.repository.getOrCreateNotification({
        notificationIntentId,
        channel,
        recipientRef: recipientRef || 'invalid',
        templateKey: intentContext.templateKey,
      });
      const attemptNumber = (await this.repository.countAttempts(notification.id)) + 1;
      await this.repository.recordDeliveryAttempt({
        notificationId: notification.id,
        channel,
        recipientRef: recipientRef || 'invalid',
        provider: this.channelRegistry.get(channel).providerId,
        attempt: attemptNumber,
        status: DELIVERY_ATTEMPT_STATUS.Failed,
        failureCode: 'INVALID_RECIPIENT',
      });
      await this.repository.updateNotificationStatus(notification.id, NOTIFICATION_STATUS.Failed);
      throw new PermanentJobError('INVALID_RECIPIENT');
    }

    const notification = await this.repository.getOrCreateNotification({
      notificationIntentId,
      channel,
      recipientRef,
      templateKey: intentContext.templateKey,
    });

    const accepted = await this.repository.findAcceptedAttempt(notification.id);
    if (accepted) {
      this.logger.log(
        `Skipping re-dispatch for accepted notification=${notification.id} providerMessageId=${accepted.provider_message_id}`,
      );
      await this.repository.updateNotificationStatus(
        notification.id,
        accepted.status === DELIVERY_ATTEMPT_STATUS.Delivered
          ? NOTIFICATION_STATUS.Delivered
          : NOTIFICATION_STATUS.Sent,
      );
      return;
    }

    const provider = this.channelRegistry.get(channel);
    const attemptNumber = (await this.repository.countAttempts(notification.id)) + 1;
    const idempotencyKey = `${notificationIntentId}:${channel}:${attemptNumber}`;

    try {
      const result = await executeProviderCall({
        operationName: `notification_dispatch_${channel}`,
        timeoutMs: loadNotificationDispatchTimeoutMs(),
        retry: false,
        fn: (signal) =>
          provider.dispatch({
            notificationId: notification.id,
            recipientRef,
            templateKey: intentContext.templateKey,
            variables,
            idempotencyKey,
            signal,
          }),
      });

      const attemptStatus = result.deliveredAt
        ? DELIVERY_ATTEMPT_STATUS.Delivered
        : DELIVERY_ATTEMPT_STATUS.Sent;

      await this.repository.recordDeliveryAttempt({
        notificationId: notification.id,
        channel,
        recipientRef,
        provider: provider.providerId,
        attempt: attemptNumber,
        status: attemptStatus,
        providerMessageId: result.providerMessageId,
        sentAt: result.sentAt,
        deliveredAt: result.deliveredAt ?? null,
      });

      await this.repository.updateNotificationStatus(
        notification.id,
        result.deliveredAt ? NOTIFICATION_STATUS.Delivered : NOTIFICATION_STATUS.Sent,
      );
    } catch (error) {
      const errorClass = classifyIntegrationError(error);
      const failureCode = isIntegrationProviderError(error) ? error.message : 'DISPATCH_FAILED';

      await this.repository.recordDeliveryAttempt({
        notificationId: notification.id,
        channel,
        recipientRef,
        provider: provider.providerId,
        attempt: attemptNumber,
        status: DELIVERY_ATTEMPT_STATUS.Failed,
        failureCode,
      });
      await this.repository.updateNotificationStatus(notification.id, NOTIFICATION_STATUS.Failed);

      if (isRetryableIntegrationError(errorClass)) {
        throw new TransientJobError(failureCode, { cause: error });
      }
      if (errorClass === INTEGRATION_ERROR_CLASSES.Permanent) {
        throw new PermanentJobError(failureCode, { cause: error });
      }
      throw new PermanentJobError(failureCode, { cause: error });
    }
  }
}
