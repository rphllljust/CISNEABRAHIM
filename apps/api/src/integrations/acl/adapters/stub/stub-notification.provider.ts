import { Injectable } from '@nestjs/common';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';
import type {
  DispatchNotificationInput,
  NotificationProvider,
} from '../../ports/notification-provider.port';

@Injectable()
export class StubNotificationProvider implements NotificationProvider {
  readonly providerId = 'stub-notification';

  dispatch(_input: DispatchNotificationInput): Promise<never> {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Permanent,
      'NOTIFICATION_PROVIDER_NOT_CONFIGURED',
    );
  }
}
