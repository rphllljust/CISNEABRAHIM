import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  futureIsoTimestamp,
  hashRefreshToken,
  insertIdentity,
  insertSession,
  pastIsoTimestamp,
  TEST_PASSWORD_HASH,
  truncateIdentityTables,
} from './test/identity-test-helpers';

const BUSINESS_TABLES = [
  'clients',
  'customers',
  'service_orders',
  'documents',
  'purchase_orders',
  'invoices',
  'payments',
] as const;

const IDENTITY_TABLES = [
  'identities',
  'credentials',
  'sessions',
  'refresh_token_families',
  'refresh_tokens',
] as const;

describe('identity persistence (PostgreSQL integration)', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for identity integration tests.');
    }

    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterEach(async () => {
    await truncateIdentityTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects duplicate normalized login identifiers', async () => {
    await insertIdentity(pool, 'User@Example.COM', TEST_PASSWORD_HASH);

    await expect(
      insertIdentity(pool, '  user@example.com  ', TEST_PASSWORD_HASH),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('rejects sessions without a valid identity foreign key', async () => {
    const missingIdentityId = randomUUID();

    await expect(
      pool.query(
        `INSERT INTO identity.sessions (id, identity_id, expires_at)
         VALUES ($1, $2, $3::timestamptz)`,
        [randomUUID(), missingIdentityId, futureIsoTimestamp()],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('enforces session expiration after creation time', async () => {
    const { identityId } = await insertIdentity(pool, 'expires@test.local');

    await expect(
      pool.query(
        `INSERT INTO identity.sessions (id, identity_id, expires_at, created_at)
         VALUES ($1, $2, $3::timestamptz, $4::timestamptz)`,
        [randomUUID(), identityId, pastIsoTimestamp(), futureIsoTimestamp()],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('persists session revocation', async () => {
    const { identityId } = await insertIdentity(pool, 'revoke@test.local');
    const sessionId = await insertSession(pool, identityId, futureIsoTimestamp(8));
    const revokedAt = new Date().toISOString();

    await pool.query(
      `UPDATE identity.sessions
       SET status = 'revoked', revoked_at = $2::timestamptz, version = version + 1
       WHERE id = $1`,
      [sessionId, revokedAt],
    );

    const result = await pool.query<{
      status: string;
      revoked_at: string | null;
    }>(`SELECT status, revoked_at FROM identity.sessions WHERE id = $1`, [sessionId]);

    expect(result.rows[0]?.status).toBe('revoked');
    expect(result.rows[0]?.revoked_at).not.toBeNull();
  });

  it('rejects refresh tokens referencing invalid families', async () => {
    await expect(
      pool.query(
        `INSERT INTO identity.refresh_tokens (id, family_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4::timestamptz)`,
        [randomUUID(), randomUUID(), hashRefreshToken('orphan-token'), futureIsoTimestamp()],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('rejects null identity_id on credentials (NOT NULL)', async () => {
    await expect(
      pool.query(
        `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized, password_hash)
         VALUES ($1, NULL, $2, $3)`,
        [randomUUID(), 'null-fk@test.local', TEST_PASSWORD_HASH],
      ),
    ).rejects.toMatchObject({ code: '23502' });
  });

  it('stores only password and refresh hashes, never plaintext secrets', async () => {
    const plainPassword = 'SuperSecretPassword-NotStored!';
    const plainRefresh = 'plain-refresh-token-value-never-stored';

    const { identityId } = await insertIdentity(pool, 'secrets@test.local', TEST_PASSWORD_HASH);
    const sessionId = await insertSession(pool, identityId, futureIsoTimestamp(12));

    const familyResult = await pool.query<{ id: string }>(
      `INSERT INTO identity.refresh_token_families (id, session_id, identity_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [randomUUID(), sessionId, identityId],
    );
    const familyId = familyResult.rows[0]?.id;
    const tokenHash = hashRefreshToken(plainRefresh);

    await pool.query(
      `INSERT INTO identity.refresh_tokens (id, family_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4::timestamptz)`,
      [randomUUID(), familyId, tokenHash, futureIsoTimestamp(24)],
    );

    const stored = await pool.query<{ password_hash: string; token_hash: string | null }>(
      `SELECT c.password_hash, rt.token_hash
       FROM identity.credentials c
       LEFT JOIN identity.refresh_token_families rtf ON rtf.identity_id = c.identity_id
       LEFT JOIN identity.refresh_tokens rt ON rt.family_id = rtf.id
       WHERE c.login_identifier_normalized = $1`,
      ['secrets@test.local'],
    );

    const row = stored.rows[0];
    expect(row?.password_hash).toBe(TEST_PASSWORD_HASH);
    expect(row?.password_hash).not.toContain(plainPassword);
    expect(row?.token_hash).toBe(tokenHash);
    expect(row?.token_hash).not.toBe(plainRefresh);
  });

  it('supports disabled account status distinct from deletion', async () => {
    const identityId = randomUUID();
    const disabledAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO identity.identities (id, status, disabled_at)
       VALUES ($1, 'disabled', $2::timestamptz)`,
      [identityId, disabledAt],
    );

    const result = await pool.query<{ status: string; disabled_at: string | null }>(
      `SELECT status, disabled_at FROM identity.identities WHERE id = $1`,
      [identityId],
    );

    expect(result.rows[0]?.status).toBe('disabled');
    expect(result.rows[0]?.disabled_at).not.toBeNull();

    const stillExists = await pool.query(`SELECT 1 FROM identity.identities WHERE id = $1`, [
      identityId,
    ]);
    expect(stillExists.rowCount).toBe(1);
  });

  it('confirms identity schema tables exist after migrations', async () => {
    const result = await pool.query<{ tablename: string }>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'identity'
       ORDER BY tablename`,
    );

    expect(result.rows.map((row) => row.tablename)).toEqual([...IDENTITY_TABLES].sort());
  });

  it('does not create business-domain tables', async () => {
    const result = await pool.query<{ tablename: string }>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname IN ('public', 'infrastructure', 'identity')
         AND tablename = ANY($1::text[])`,
      [BUSINESS_TABLES],
    );

    expect(result.rows).toHaveLength(0);
  });

  it('verifies identity constraints are present after migration', async () => {
    const result = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM information_schema.table_constraints
       WHERE constraint_schema = 'identity'`,
    );

    expect(Number(result.rows[0]?.count ?? 0)).toBeGreaterThanOrEqual(15);
  });
});
