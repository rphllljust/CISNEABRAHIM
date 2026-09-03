import type { PoolClient } from 'pg';
import { registerScopedDocument } from '../../authorization/application/scoped-document-registration';
import { DOCUMENT_CLASSIFICATIONS } from '../domain/document-categories';

export type GeneratedDocumentRegistration = {
  documentId: string;
  storedObjectId: string;
  storageKey: string;
  sha256: string;
  byteSize: number;
  originalFilename: string;
  title: string;
  unitId: string;
  actorIdentityId: string;
  isFinancial: boolean;
};

/**
 * Public DOCUMENTS application contract for generated artifacts.
 * It participates in the caller transaction without exposing DOCUMENTS tables.
 */
export async function registerGeneratedDocument(
  client: PoolClient,
  input: GeneratedDocumentRegistration,
): Promise<void> {
  await client.query(
    `INSERT INTO doc.documents (
       id,
       title,
       category_code,
       classification_code,
       unit_id,
       current_version_number,
       created_by_identity_id,
       updated_by_identity_id
     )
     VALUES ($1, $2, 'BILLING_DOCUMENT', $3, $4, 1, $5, $5)`,
    [
      input.documentId,
      input.title,
      DOCUMENT_CLASSIFICATIONS.Internal,
      input.unitId,
      input.actorIdentityId,
    ],
  );

  await registerScopedDocument(client, {
    documentId: input.documentId,
    ownerIdentityId: input.actorIdentityId,
    unitId: input.unitId,
    isFinancial: input.isFinancial,
    label: input.title,
  });

  await client.query(
    `INSERT INTO doc.stored_objects (
       id,
       storage_key,
       sha256_hash,
       mime_type,
       byte_size,
       original_filename
     )
     VALUES ($1, $2, $3, 'application/pdf', $4, $5)`,
    [
      input.storedObjectId,
      input.storageKey,
      input.sha256,
      input.byteSize,
      input.originalFilename,
    ],
  );

  await client.query(
    `INSERT INTO doc.document_versions (
       document_id,
       version_number,
       stored_object_id,
       uploaded_by_identity_id
     )
     VALUES ($1, 1, $2, $3)`,
    [input.documentId, input.storedObjectId, input.actorIdentityId],
  );
}
