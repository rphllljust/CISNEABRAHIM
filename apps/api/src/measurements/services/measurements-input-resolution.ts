import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import { measurementsAccessNotFound } from './measurements-access.errors';

export function assertValidMeasurementId(measurementId: string): void {
  try {
    assertUuid(measurementId, 'measurementId');
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      throw measurementsAccessNotFound();
    }
    throw error;
  }
}
