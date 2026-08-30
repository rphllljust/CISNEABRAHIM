import type { IntegrationTrackingSnapshot } from '../domain/integration-models';

export type FetchTrackingStatusInput = {
  trackingCode: string;
  signal?: AbortSignal;
};

export interface TrackingProvider {
  readonly providerId: string;
  fetchStatus(input: FetchTrackingStatusInput): Promise<IntegrationTrackingSnapshot | null>;
}

export const TRACKING_PROVIDER = Symbol('TRACKING_PROVIDER');
