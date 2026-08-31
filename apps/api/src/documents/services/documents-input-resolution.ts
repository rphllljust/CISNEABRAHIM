import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import { documentsAccessNotFound } from './documents-access.errors';

export function assertValidDocumentId(documentId: string): void {
  try {
    assertUuid(documentId);
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      throw documentsAccessNotFound();
    }
    throw error;
  }
}
