import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export type AuthzScopeTypeDb =
  | 'GLOBAL'
  | 'OWN'
  | 'ASSIGNED'
  | 'UNIT'
  | 'CLIENT'
  | 'CONTRACT'
  | 'DOCUMENT'
  | 'FINANCIAL'
  | 'PLATFORM';

export type InsertGrantInput = {
  identityId: string;
  action: string;
  resourceType: string;
  scopeType: AuthzScopeTypeDb;
  grantedByIdentityId: string;
  resourceId?: string;
  validFrom?: string;
  validUntil?: string;
  revokedAt?: string;
};

export type InsertScopeRefInput = {
  scopeType: Extract<AuthzScopeTypeDb, 'UNIT' | 'CLIENT' | 'CONTRACT' | 'DOCUMENT' | 'FINANCIAL'>;
  refId: string;
};

export type InsertScopedRecordInput = {
  ownerIdentityId: string;
  assignedIdentityId?: string;
  unitId: string;
  clientId: string;
  contractId: string;
  documentId: string;
  isFinancial?: boolean;
  label?: string;
};

export async function insertScopeRef(client: DbClient, input: InsertScopeRefInput): Promise<void> {
  await client.query(
    `INSERT INTO "authorization".scope_refs (scope_type, ref_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [input.scopeType, input.refId],
  );
}

export async function insertScopedRecord(
  client: DbClient,
  input: InsertScopedRecordInput,
): Promise<string> {
  const recordId = randomUUID();
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
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      recordId,
      input.ownerIdentityId,
      input.assignedIdentityId ?? null,
      input.unitId,
      input.clientId,
      input.contractId,
      input.documentId,
      input.isFinancial ?? false,
      input.label ?? '',
    ],
  );
  return recordId;
}

export async function insertGrant(client: DbClient, input: InsertGrantInput): Promise<string> {
  const grantId = randomUUID();
  await client.query(
    `INSERT INTO "authorization".grants (
       id,
       identity_id,
       action,
       resource_type,
       resource_id,
       scope_type,
       granted_by_identity_id,
       valid_from,
       valid_until,
       revoked_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, NOW()), $9::timestamptz, $10::timestamptz)`,
    [
      grantId,
      input.identityId,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.scopeType,
      input.grantedByIdentityId,
      input.validFrom ?? null,
      input.validUntil ?? null,
      input.revokedAt ?? null,
    ],
  );
  return grantId;
}

export async function truncateAuthorizationTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      "authorization".access_role_capabilities,
      "authorization".access_role_assignments,
      "authorization".access_roles,
      "authorization".approval_matrix_rules,
      "authorization".approval_matrix_versions,
      "authorization".approval_matrices,
      "authorization".approval_role_assignments,
      "authorization".decision_audits,
      "authorization".scoped_records,
      "authorization".grants,
      "authorization".scope_refs
    RESTART IDENTITY CASCADE
  `);
}

export async function truncateIdentityAndAuthorizationTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      audit.security_audit_events,
      "authorization".access_role_capabilities,
      "authorization".access_role_assignments,
      "authorization".access_roles,
      "authorization".approval_matrix_rules,
      "authorization".approval_matrix_versions,
      "authorization".approval_matrices,
      "authorization".approval_role_assignments,
      "authorization".decision_audits,
      "authorization".scoped_records,
      "authorization".grants,
      "authorization".scope_refs,
      identity.refresh_tokens,
      identity.refresh_token_families,
      identity.sessions,
      identity.credentials,
      identity.identities
    RESTART IDENTITY CASCADE
  `);
}
