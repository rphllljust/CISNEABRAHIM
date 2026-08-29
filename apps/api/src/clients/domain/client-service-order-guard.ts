import type { ClientStatus } from './client-status';
import { CLIENT_STATUSES } from './client-status';

export type ClientReleaseEligibilityErrorCode =
  | 'CLIENT_REQUIRED'
  | 'CLIENT_NOT_FOUND'
  | 'CLIENT_INACTIVE';

export class ClientReleaseEligibilityError extends Error {
  constructor(readonly code: ClientReleaseEligibilityErrorCode) {
    super(code);
  }
}

export type ClientReleaseCandidate = {
  id: string;
  status: ClientStatus;
} | null;

/**
 * Invariante BR-037 / SRC-002 Q15: liberação de OS exige Cliente existente e ACTIVE.
 * Consumidores futuros (ReleaseServiceOrder) devem invocar antes da transição para RELEASED.
 */
export function assertClientEligibleForServiceOrderRelease(
  client: ClientReleaseCandidate,
): asserts client is { id: string; status: typeof CLIENT_STATUSES.Active } {
  if (client === null || client === undefined) {
    throw new ClientReleaseEligibilityError('CLIENT_REQUIRED');
  }
  if (!client.id) {
    throw new ClientReleaseEligibilityError('CLIENT_NOT_FOUND');
  }
  if (client.status !== CLIENT_STATUSES.Active) {
    throw new ClientReleaseEligibilityError('CLIENT_INACTIVE');
  }
}
