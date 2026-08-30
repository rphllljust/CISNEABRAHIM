import type {
  IntegrationNotificationDispatch,
  IntegrationNotificationResult,
} from '../domain/integration-models';

export type DispatchNotificationInput = IntegrationNotificationDispatch & {
  signal?: AbortSignal;
};

export interface NotificationProvider {
  readonly providerId: string;
  dispatch(input: DispatchNotificationInput): Promise<IntegrationNotificationResult>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
