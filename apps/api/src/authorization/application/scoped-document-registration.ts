import type { PoolClient } from 'pg';

export type ScopedDocumentRegistration = {
  documentId: string;
  ownerIdentityId: string;
  unitId: string;
  clientId?: string;
  contractId?: string;
  isFinancial: boolean;
  label: string;
};

/**
 * Public PLATFORM application contract for atomically registering document scope.
 * Callers provide their active transaction; authorization remains the only SQL owner.
 */
export async function registerScopedDocument(
  client: PoolClient,
  input: ScopedDocumentRegistration,
): Promise<void> {
  await client.query(
    `INSERT INTO "authorization".scoped_records (
       id,
       owner_identity_id,
       assigned_identity_id,
       unit_id,
       client_id,
       contract_id,
       document_id,
       is_financial,
       label
     )
     VALUES (gen_random_uuid(), $1, NULL, $2, $3, $4, $5, $6, $7)`,
    [
      input.ownerIdentityId,
      input.unitId,
      input.clientId ?? `unassigned-${input.documentId}`,
      input.contractId ?? `unassigned-${input.documentId}`,
      input.documentId,
      input.isFinancial,
      input.label,
    ],
  );
}
