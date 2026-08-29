import {
  assertClientEligibleForServiceOrderRelease,
  ClientReleaseEligibilityError,
} from '../../clients/domain/client-service-order-guard';
import type { ClientStatus } from '../../clients/domain/client-status';
import { SERVICE_ORDER_STATUSES } from './service-order';

export type ServiceOrderReleaseCandidate = {
  status: string;
  client_id: string | null;
  service_definition_id: string | null;
  service_definition_version_id: string | null;
  service_snapshot: Record<string, unknown>;
};

export type ClientReleaseLookup = {
  id: string;
  status: ClientStatus;
} | null;

export class ServiceOrderReleaseError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function assertServiceOrderReleasePreconditions(
  order: ServiceOrderReleaseCandidate,
  client: ClientReleaseLookup,
): void {
  if (order.status !== SERVICE_ORDER_STATUSES.Prepared) {
    throw new ServiceOrderReleaseError('INVALID_STATE');
  }
  if (!order.service_definition_id || !order.service_definition_version_id) {
    throw new ServiceOrderReleaseError('SERVICE_REQUIRED');
  }
  const serviceCode = order.service_snapshot?.['serviceCode'];
  if (typeof serviceCode !== 'string' || serviceCode.trim().length === 0) {
    throw new ServiceOrderReleaseError('SERVICE_SNAPSHOT_REQUIRED');
  }
  if (!order.client_id) {
    throw new ServiceOrderReleaseError('CLIENT_REQUIRED');
  }
  if (!client) {
    throw new ServiceOrderReleaseError('CLIENT_NOT_FOUND');
  }
  if (client.id !== order.client_id) {
    throw new ServiceOrderReleaseError('CLIENT_NOT_FOUND');
  }

  try {
    assertClientEligibleForServiceOrderRelease({
      id: client.id,
      status: client.status,
    });
  } catch (error) {
    if (error instanceof ClientReleaseEligibilityError) {
      throw new ServiceOrderReleaseError(error.code);
    }
    throw error;
  }
}

export function assertServiceOrderPreparePreconditions(order: ServiceOrderReleaseCandidate): void {
  if (order.status !== SERVICE_ORDER_STATUSES.Draft) {
    throw new ServiceOrderReleaseError('INVALID_STATE');
  }
  if (!order.service_definition_id || !order.service_definition_version_id) {
    throw new ServiceOrderReleaseError('SERVICE_REQUIRED');
  }
}
