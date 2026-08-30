import { Injectable } from '@nestjs/common';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';
import type { FetchTrackingStatusInput, TrackingProvider } from '../../ports/tracking-provider.port';

@Injectable()
export class StubTrackingProvider implements TrackingProvider {
  readonly providerId = 'stub-tracking';

  fetchStatus(_input: FetchTrackingStatusInput): Promise<null> {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Permanent,
      'TRACKING_PROVIDER_NOT_CONFIGURED',
    );
  }
}
