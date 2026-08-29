import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export type InsertGrantInput = {
  identityId: string;
  action: string;
  resourceType: string;
  scopeType: 'GLOBAL' | 'OWN' | 'PLATFORM';
  grantedByIdentityId: string;
  resourceId?: string;
  validFrom?: string;
  validUntil?: string;
  revokedAt?: string;
};

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
      "authorization".decision_audits,
      "authorization".grants
    RESTART IDENTITY CASCADE
  `);
}

export async function truncateIdentityAndAuthorizationTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      "authorization".decision_audits,
      "authorization".grants,
      identity.refresh_tokens,
      identity.refresh_token_families,
      identity.sessions,
      identity.credentials,
      identity.identities
    RESTART IDENTITY CASCADE
  `);
}
