import { assertUuid, InvalidUuidError } from '../../platform/kernel/uuid';
import { documentsAccessNotFound } from './documents-access.errors';

export function assertValidDocumentId(documentId: string): void {
  try {
    assertUuid(documentId);
  } catch (error) {
    if (error instanceof InvalidUuidError) {
      throw documentsAccessNotFound();
    }
    throw error;
  }
}
