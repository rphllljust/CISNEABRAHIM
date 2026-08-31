import { randomBytes } from 'node:crypto';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import { serviceRequestsAccessNotFound } from './service-requests-access.errors';

export function assertValidServiceRequestId(serviceRequestId: string): void {
  try {
    assertUuid(serviceRequestId);
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      throw serviceRequestsAccessNotFound();
    }
    throw error;
  }
}

export function generateServiceRequestCode(): string {
  return `SR-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}
