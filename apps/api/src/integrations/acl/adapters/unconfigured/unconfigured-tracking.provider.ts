import { Injectable } from '@nestjs/common';
import { throwIntegrationNotConfigured } from '../../domain/integration-not-configured';
import type { FetchTrackingStatusInput, TrackingProvider } from '../../ports/tracking-provider.port';

@Injectable()
export class UnconfiguredTrackingProvider implements TrackingProvider {
  readonly providerId = 'unconfigured';

  async fetchStatus(_input: FetchTrackingStatusInput): Promise<never> {
    throwIntegrationNotConfigured('TRACKING');
  }
}
