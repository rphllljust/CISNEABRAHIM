import { Injectable } from '@nestjs/common';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../../integrations/acl/domain/integration-error';
import { NOTIFICATION_CHANNELS } from '../../domain/notification-channel';
import type {
  NotificationChannelDispatchInput,
  NotificationChannelProvider,
} from '../../ports/notification-channel.port';

@Injectable()
export class UnconfiguredEmailChannelProvider implements NotificationChannelProvider {
  readonly channel = NOTIFICATION_CHANNELS.Email;
  readonly providerId = 'unconfigured-email';

  dispatch(_input: NotificationChannelDispatchInput): Promise<never> {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Permanent,
      'EMAIL_NOTIFICATION_NOT_CONFIGURED',
    );
  }
}

@Injectable()
export class UnconfiguredWhatsAppChannelProvider implements NotificationChannelProvider {
  readonly channel = NOTIFICATION_CHANNELS.Whatsapp;
  readonly providerId = 'unconfigured-whatsapp';

  dispatch(_input: NotificationChannelDispatchInput): Promise<never> {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Permanent,
      'WHATSAPP_NOTIFICATION_NOT_CONFIGURED',
    );
  }
}
