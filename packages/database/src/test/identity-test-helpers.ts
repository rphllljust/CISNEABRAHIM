import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

/** bcrypt-shaped hash for tests — never a real password. */
export const TEST_PASSWORD_HASH = '$2b$12$abcdefghijklmnopqrstuv012345678901234567890123456789012';

export function normalizeLoginIdentifier(login: string): string {
  return login.trim().toLowerCase();
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function futureIsoTimestamp(hoursFromNow = 1): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

export function pastIsoTimestamp(hoursAgo = 1): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export async function insertIdentity(
  client: Pool | PoolClient,
  login: string,
  passwordHash: string = TEST_PASSWORD_HASH,
): Promise<{ identityId: string; credentialId: string }> {
  const identityId = randomUUID();
  const credentialId = randomUUID();
  const normalized = normalizeLoginIdentifier(login);

  await client.query(
    `INSERT INTO identity.identities (id, status)
     VALUES ($1, 'active')`,
    [identityId],
  );

  await client.query(
    `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [credentialId, identityId, normalized, passwordHash],
  );

  return { identityId, credentialId };
}

export async function insertSession(
  client: Pool | PoolClient,
  identityId: string,
  expiresAt: string,
): Promise<string> {
  const sessionId = randomUUID();

  await client.query(
    `INSERT INTO identity.sessions (id, identity_id, expires_at)
     VALUES ($1, $2, $3::timestamptz)`,
    [sessionId, identityId, expiresAt],
  );

  return sessionId;
}

export async function truncateIdentityTables(client: Pool | PoolClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      identity.refresh_tokens,
      identity.refresh_token_families,
      identity.sessions,
      identity.credentials,
      identity.identities
    RESTART IDENTITY CASCADE
  `);
}
