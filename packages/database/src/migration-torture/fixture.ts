import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';

export const TORTURE_UNIT = 'unit-migration-torture';

export const FIXTURE = {
  actorId: '11111111-1111-4111-8111-111111111111',
  categoryId: '11111111-1111-4111-8111-111111111112',
  definitionId: '33333333-3333-4333-8333-333333333333',
  versionId: '44444444-4444-4444-8444-444444444444',
  clientId: '22222222-2222-4222-8222-222222222222',
  assetId: '55555555-5555-4555-8555-555555555555',
  proposalId: '66666666-6666-4666-8666-666666666666',
  proposalVersionId: '66666666-6666-4666-8666-666666666667',
  purchaseOrderId: '77777777-7777-4777-8777-777777777777',
  serviceRequestId: '88888888-8888-4888-8888-888888888888',
  serviceOrderId: '99999999-9999-4999-8999-999999999999',
  executionEntryId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  measurementId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
  measurementItemId: 'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
  billingRecordId: 'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
  storedObjectId: 'ffffffff-ffff-4fff-8fff-ffffffffff01',
  documentId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',
  documentVersionId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02',
} as const;

export type PreservationSnapshot = Record<string, { count: number; digest: string }>;

const PRESERVATION_QUERIES: Array<{ key: string; sql: string }> = [
  {
    key: 'clients',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || legal_name, ',' ORDER BY id)), 'empty') AS digest
          FROM pty.clients`,
  },
  {
    key: 'catalog',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || code, ',' ORDER BY id)), 'empty') AS digest
          FROM cat.service_definitions`,
  },
  {
    key: 'assets',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || asset_code, ',' ORDER BY id)), 'empty') AS digest
          FROM ast.physical_assets`,
  },
  {
    key: 'requests',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || request_code, ',' ORDER BY id)), 'empty') AS digest
          FROM sr.service_requests`,
  },
  {
    key: 'proposals',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || proposal_code, ',' ORDER BY id)), 'empty') AS digest
          FROM com.proposals`,
  },
  {
    key: 'purchase_orders',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || internal_code, ',' ORDER BY id)), 'empty') AS digest
          FROM com.purchase_orders`,
  },
  {
    key: 'service_orders',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || order_number, ',' ORDER BY id)), 'empty') AS digest
          FROM so.service_orders`,
  },
  {
    key: 'execution',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || entry_type::text, ',' ORDER BY id)), 'empty') AS digest
          FROM so.execution_entries`,
  },
  {
    key: 'measurements',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || status::text, ',' ORDER BY id)), 'empty') AS digest
          FROM msr.measurements`,
  },
  {
    key: 'billing',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || total_amount::text, ',' ORDER BY id)), 'empty') AS digest
          FROM bil.billing_records`,
  },
  {
    key: 'documents',
    sql: `SELECT COUNT(*)::int AS count,
                 COALESCE(md5(string_agg(id::text || title, ',' ORDER BY id)), 'empty') AS digest
          FROM doc.documents`,
  },
  {
    key: 'history',
    sql: `SELECT
            (SELECT COUNT(*)::int FROM so.service_order_history_events)
            + (SELECT COUNT(*)::int FROM so.execution_entry_history_events)
            + (SELECT COUNT(*)::int FROM msr.measurement_history_events)
            + (SELECT COUNT(*)::int FROM bil.billing_history_events) AS count,
            md5(
              COALESCE((SELECT string_agg(id::text, ',' ORDER BY id) FROM so.service_order_history_events), '')
              || '|'
              || COALESCE((SELECT string_agg(id::text, ',' ORDER BY id) FROM so.execution_entry_history_events), '')
              || '|'
              || COALESCE((SELECT string_agg(id::text, ',' ORDER BY id) FROM msr.measurement_history_events), '')
              || '|'
              || COALESCE((SELECT string_agg(id::text, ',' ORDER BY id) FROM bil.billing_history_events), '')
            ) AS digest`,
  },
];

export async function capturePreservationSnapshot(client: PoolClient): Promise<PreservationSnapshot> {
  const snapshot: PreservationSnapshot = {};
  for (const query of PRESERVATION_QUERIES) {
    const result = await client.query<{ count: number; digest: string }>(query.sql);
    snapshot[query.key] = {
      count: result.rows[0]?.count ?? 0,
      digest: result.rows[0]?.digest ?? 'empty',
    };
  }
  return snapshot;
}

export function comparePreservationSnapshots(
  before: PreservationSnapshot,
  after: PreservationSnapshot,
): string[] {
  const mismatches: string[] = [];
  for (const key of Object.keys(before)) {
    const left = before[key];
    const right = after[key];
    if (!right) {
      mismatches.push(`${key}: missing after migration`);
      continue;
    }
    if (left.count !== right.count || left.digest !== right.digest) {
      mismatches.push(
        `${key}: before count=${left.count} digest=${left.digest} after count=${right.count} digest=${right.digest}`,
      );
    }
  }
  return mismatches;
}

export async function seedPreservationFixture(client: PoolClient): Promise<void> {
  const f = FIXTURE;
  const unit = TORTURE_UNIT;
  const passwordHash = '$2b$12$torture.fixture.hash.placeholder.abcdefghijklmnopqrstuvwxyz012345';

  await client.query(
    `INSERT INTO "authorization".scope_refs (scope_type, ref_id) VALUES ('UNIT', $1) ON CONFLICT DO NOTHING`,
    [unit],
  );

  await client.query(`INSERT INTO identity.identities (id, status) VALUES ($1, 'active')`, [f.actorId]);
  await client.query(
    `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), f.actorId, `migration-torture-${f.actorId}@cisne.invalid`, passwordHash],
  );

  await client.query(
    `INSERT INTO pty.clients (id, legal_name, normalized_tax_id, status, version)
     VALUES ($1, 'Cliente Torture', '12345678000199', 'ACTIVE', 1)`,
    [f.clientId],
  );

  await client.query(
    `INSERT INTO cat.service_categories (id, code, name, created_by_identity_id, updated_by_identity_id)
     VALUES ($1, 'TORTURE-CAT', 'Categoria Torture', $2, $2)`,
    [f.categoryId, f.actorId],
  );

  await client.query(
    `INSERT INTO cat.service_definitions (id, code, created_by_identity_id, updated_by_identity_id)
     VALUES ($1, 'TORTURE-SVC', $2, $2)`,
    [f.definitionId, f.actorId],
  );

  await client.query(
    `INSERT INTO cat.service_definition_versions (
       id, service_definition_id, version, status, category_id, archetype, name,
       measurement_mode, published_at, published_by_identity_id,
       created_by_identity_id, updated_by_identity_id
     ) VALUES (
       $1, $2, 1, 'ACTIVE', $3, 'RENTAL', 'Serviço Torture',
       'BY_PERIOD', NOW(), $4, $4, $4
     )`,
    [f.versionId, f.definitionId, f.categoryId, f.actorId],
  );

  const resourceType = await client.query<{ id: string }>(
    `SELECT id FROM cat.physical_resource_types WHERE code = 'CAR' LIMIT 1`,
  );
  const resourceTypeId = resourceType.rows[0]?.id;
  if (!resourceTypeId) {
    throw new Error('CAR physical resource type missing after migrations');
  }

  await client.query(
    `INSERT INTO ast.physical_assets (
       id, asset_code, physical_resource_type_id, name, unit_id,
       created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, 'AST-TORTURE-001', $2, 'Ativo Torture', $3, $4, $4)`,
    [f.assetId, resourceTypeId, unit, f.actorId],
  );

  await client.query(
    `INSERT INTO com.proposals (
       id, proposal_code, client_id, unit_id, title, current_version_number,
       created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, 'PROP-TORTURE-001', $2, $3, 'Proposta Torture', 1, $4, $4)`,
    [f.proposalId, f.clientId, unit, f.actorId],
  );

  await client.query(
    `INSERT INTO com.proposal_versions (
       id, proposal_id, version_number, status, pricing_structure, global_sale_price_amount
     ) VALUES ($1, $2, 1, 'ACCEPTED', 'GLOBAL_PRICE', 1000.0000)`,
    [f.proposalVersionId, f.proposalId],
  );

  await client.query(
    `INSERT INTO com.purchase_orders (
       id, internal_code, client_id, unit_id, po_number, pricing_structure,
       total_amount, created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, 'PO-TORTURE-001', $2, $3, 'PO-2026-001', 'HEADER_TOTAL', 2500.5000, $4, $4)`,
    [f.purchaseOrderId, f.clientId, unit, f.actorId],
  );

  await client.query(
    `INSERT INTO sr.service_requests (
       id, request_code, unit_id, status, origin_source, client_id,
       service_definition_id, service_definition_version_id, proposal_id, purchase_order_id,
       created_by_identity_id, updated_by_identity_id
     ) VALUES (
       $1, 'SR-TORTURE-001', $2, 'APPROVED', 'DIRECT_REQUEST', $3,
       $4, $5, $6, $7, $8, $8
     )`,
    [
      f.serviceRequestId,
      unit,
      f.clientId,
      f.definitionId,
      f.versionId,
      f.proposalId,
      f.purchaseOrderId,
      f.actorId,
    ],
  );

  await client.query(
    `INSERT INTO so.service_orders (
       id, internal_code, order_number, unit_id, status, origin,
       client_id, client_snapshot, service_definition_id, service_definition_version_id,
       service_request_id, proposal_id, purchase_order_id,
       started_at, started_by_identity_id, completed_at, completed_by_identity_id,
       created_by_identity_id, updated_by_identity_id
     ) VALUES (
       $1, 'SO-INT-TORTURE', 'SO-TORTURE-001', $2, 'COMPLETED', 'SERVICE_REQUEST',
       $3, '{"legalName":"Cliente Torture"}'::jsonb, $4, $5,
       $6, $7, $8,
       NOW() - interval '2 hours', $9,
       NOW() - interval '1 hour', $9,
       $9, $9
     )`,
    [
      f.serviceOrderId,
      unit,
      f.clientId,
      f.definitionId,
      f.versionId,
      f.serviceRequestId,
      f.proposalId,
      f.purchaseOrderId,
      f.actorId,
    ],
  );

  await client.query(
    `INSERT INTO so.service_order_history_events (id, service_order_id, event_type, actor_identity_id)
     VALUES ($1, $2, 'COMPLETED', $3)`,
    [randomUUID(), f.serviceOrderId, f.actorId],
  );

  await client.query(
    `INSERT INTO so.execution_entries (
       id, service_order_id, entry_type, quantity_value, quantity_unit_code,
       actor_identity_id
     ) VALUES ($1, $2, 'QUANTITY', 12.345678, 'HOUR', $3)`,
    [f.executionEntryId, f.serviceOrderId, f.actorId],
  );

  await client.query(
    `INSERT INTO so.execution_entry_history_events (id, execution_entry_id, event_type, actor_identity_id)
     VALUES ($1, $2, 'RECORDED', $3)`,
    [randomUUID(), f.executionEntryId, f.actorId],
  );

  await client.query(
    `INSERT INTO msr.measurements (
       id, service_order_id, unit_id, status,
       decided_at, decided_by_identity_id,
       created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, $2, $3, 'APPROVED', NOW(), $4, $4, $4)`,
    [f.measurementId, f.serviceOrderId, unit, f.actorId],
  );

  await client.query(
    `INSERT INTO msr.measurement_items (
       id, measurement_id, line_number, source_execution_entry_id,
       unit_code, actual_quantity, measured_quantity, unit_price, line_amount
     ) VALUES ($1, $2, 1, $3, 'HOUR', 12.345678, 12.345678, 99.9999, 1234.5678)`,
    [f.measurementItemId, f.measurementId, f.executionEntryId],
  );

  await client.query(
    `INSERT INTO msr.measurement_history_events (id, measurement_id, event_type, actor_identity_id)
     VALUES ($1, $2, 'APPROVED', $3)`,
    [randomUUID(), f.measurementId, f.actorId],
  );

  await client.query(
    `INSERT INTO bil.billing_records (
       id, service_order_id, measurement_id, client_id, unit_id,
       client_legal_name_snapshot, payment_terms, payment_terms_source,
       total_amount, prepared_by_identity_id, created_by_identity_id, updated_by_identity_id
     ) VALUES (
       $1, $2, $3, $4, $5, 'Cliente Torture', '30 DDL', 'DECLARED',
       1234.5678, $6, $6, $6
     )`,
    [f.billingRecordId, f.serviceOrderId, f.measurementId, f.clientId, unit, f.actorId],
  );

  await client.query(
    `INSERT INTO bil.billing_items (
       id, billing_record_id, line_number, measurement_item_id,
       source_execution_entry_id, unit_code, quantity, unit_price, line_amount, line_label
     ) VALUES ($1, $2, 1, $3, $4, 'HOUR', 12.345678, 99.9999, 1234.5678, 'Linha torture')`,
    [randomUUID(), f.billingRecordId, f.measurementItemId, f.executionEntryId],
  );

  await client.query(
    `INSERT INTO bil.billing_history_events (id, billing_record_id, event_type, actor_identity_id)
     VALUES ($1, $2, 'PREPARED', $3)`,
    [randomUUID(), f.billingRecordId, f.actorId],
  );

  await client.query(
    `INSERT INTO doc.stored_objects (
       id, storage_key, sha256_hash, mime_type, byte_size, original_filename
     ) VALUES ($1, 'torture/doc.pdf', 'abc123', 'application/pdf', 128, 'doc.pdf')`,
    [f.storedObjectId],
  );

  await client.query(
    `INSERT INTO doc.documents (
       id, title, category_code, unit_id, current_version_number,
       created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, 'Documento Torture', 'GENERAL', $2, 1, $3, $3)`,
    [f.documentId, unit, f.actorId],
  );

  await client.query(
    `INSERT INTO doc.document_versions (
       id, document_id, version_number, stored_object_id, uploaded_by_identity_id
     ) VALUES ($1, $2, 1, $3, $4)`,
    [f.documentVersionId, f.documentId, f.storedObjectId, f.actorId],
  );
}

export async function countOrphanReferences(client: PoolClient): Promise<number> {
  const result = await client.query<{ orphans: string }>(
    `SELECT (
       (SELECT COUNT(*) FROM so.service_orders so
        LEFT JOIN pty.clients c ON c.id = so.client_id
        WHERE so.client_id IS NOT NULL AND c.id IS NULL)
       + (SELECT COUNT(*) FROM bil.billing_records br
          LEFT JOIN msr.measurements m ON m.id = br.measurement_id
          WHERE m.id IS NULL)
       + (SELECT COUNT(*) FROM msr.measurement_items mi
          LEFT JOIN msr.measurements m ON m.id = mi.measurement_id
          WHERE m.id IS NULL)
     )::text AS orphans`,
  );
  return Number(result.rows[0]?.orphans ?? '0');
}
