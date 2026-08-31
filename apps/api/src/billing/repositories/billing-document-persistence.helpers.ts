import type { PoolClient } from 'pg';
import { DOCUMENT_CLASSIFICATIONS } from '../../documents/domain/document-categories';
import { BILLING_DOCUMENT_COMMANDS, formatBillingDocumentNumber } from '../domain/billing-document';
import type {
  AllocatedDocumentNumber,
  BillingDocumentCommandIdempotencyRow,
  BillingDocumentRow,
} from './billing-document.repository.types';
import { BILLING_DOCUMENT_RETURNING } from './billing-document-sql.constants';

export async function allocateBillingDocumentNumber(
  client: PoolClient,
  sequenceYear: number,
): Promise<AllocatedDocumentNumber> {
  await client.query(
    `INSERT INTO bil.billing_document_number_sequences (sequence_year, next_number)
     VALUES ($1, 2)
     ON CONFLICT (sequence_year) DO NOTHING`,
    [sequenceYear],
  );

  const locked = await client.query<{ next_number: string }>(
    `SELECT next_number::text AS next_number
     FROM bil.billing_document_number_sequences
     WHERE sequence_year = $1
     FOR UPDATE`,
    [sequenceYear],
  );
  const nextNumber = Number(locked.rows[0]?.next_number ?? '1');
  const allocated = await client.query<{ next_number: string }>(
    `UPDATE bil.billing_document_number_sequences
     SET next_number = next_number + 1, updated_at = NOW()
     WHERE sequence_year = $1
     RETURNING (next_number - 1)::text AS next_number`,
    [sequenceYear],
  );
  const sequenceNumber = Number(allocated.rows[0]?.next_number ?? String(nextNumber));
  return {
    sequenceYear,
    sequenceNumber,
    documentNumber: formatBillingDocumentNumber(sequenceYear, sequenceNumber),
  };
}

export async function persistBillingDocumentRecords(
  client: PoolClient,
  input: {
    documentId: string;
    storedObjectId: string;
    storageKey: string;
    sha256: string;
    byteSize: number;
    originalFilename: string;
    title: string;
    unitId: string;
    actorIdentityId: string;
  },
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
     VALUES (gen_random_uuid(), $1, NULL, $2, $3, $4, $5, TRUE, $6)`,
    [
      input.actorIdentityId,
      input.unitId,
      `unassigned-${input.documentId}`,
      `unassigned-${input.documentId}`,
      input.documentId,
      input.title,
    ],
  );

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

export async function findBillingDocumentByIdWithClient(
  client: PoolClient,
  billingDocumentId: string,
): Promise<BillingDocumentRow | null> {
  const result = await client.query<BillingDocumentRow>(
    `SELECT ${BILLING_DOCUMENT_RETURNING} FROM bil.billing_documents WHERE id = $1`,
    [billingDocumentId],
  );
  return result.rows[0] ?? null;
}

export async function findBillingDocumentIssueIdempotency(
  client: PoolClient,
  billingRecordId: string,
  idempotencyKey: string,
): Promise<BillingDocumentCommandIdempotencyRow | null> {
  const result = await client.query<BillingDocumentCommandIdempotencyRow>(
    `SELECT id, billing_document_id, billing_record_id, command_name, idempotency_key, response_payload, created_at
     FROM bil.billing_document_command_idempotency
     WHERE billing_record_id = $1 AND command_name = $2 AND idempotency_key = $3`,
    [billingRecordId, BILLING_DOCUMENT_COMMANDS.Issue, idempotencyKey],
  );
  return result.rows[0] ?? null;
}

export async function findBillingDocumentCancelIdempotency(
  client: PoolClient,
  billingRecordId: string,
  idempotencyKey: string,
): Promise<BillingDocumentCommandIdempotencyRow | null> {
  const result = await client.query<BillingDocumentCommandIdempotencyRow>(
    `SELECT id, billing_document_id, billing_record_id, command_name, idempotency_key, response_payload, created_at
     FROM bil.billing_document_command_idempotency
     WHERE billing_record_id = $1 AND command_name = $2 AND idempotency_key = $3`,
    [billingRecordId, BILLING_DOCUMENT_COMMANDS.Cancel, idempotencyKey],
  );
  return result.rows[0] ?? null;
}

export async function insertBillingDocumentItems(
  client: PoolClient,
  billingDocumentId: string,
  billingItems: Array<{
    line_number: number;
    id: string;
    measurement_item_id: string | null;
    unit_code: string;
    quantity: string;
    unit_price: string | null;
    line_amount: string;
    line_label: string;
    pricing_line_snapshot: Record<string, unknown>;
  }>,
): Promise<void> {
  for (const item of billingItems) {
    await client.query(
      `INSERT INTO bil.billing_document_items (
         billing_document_id,
         line_number,
         billing_item_id,
         measurement_item_id,
         unit_code,
         quantity,
         unit_price,
         line_amount,
         line_label,
         pricing_line_snapshot
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        billingDocumentId,
        item.line_number,
        item.id,
        item.measurement_item_id,
        item.unit_code,
        item.quantity,
        item.unit_price,
        item.line_amount,
        item.line_label,
        JSON.stringify(item.pricing_line_snapshot),
      ],
    );
  }
}
