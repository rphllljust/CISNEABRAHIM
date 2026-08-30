import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Client, Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  capturePreservationSnapshot,
  comparePreservationSnapshots,
  countOrphanReferences,
  FIXTURE,
  seedPreservationFixture,
} from './migration-torture/fixture';
import {
  applyMigrations,
  assertSmokeSchema,
  databaseUrlForName,
  MIGRATION_FILES,
  recreateDatabase,
} from './migration-torture/harness';

config({ path: resolve(__dirname, '../../.env') });

const adminDatabaseUrl = process.env['DATABASE_URL'];
const ZERO_DB = process.env['MIGRATION_TORTURE_ZERO_DB'] ?? 'cisne_migration_torture_zero';
const INCREMENTAL_DB =
  process.env['MIGRATION_TORTURE_INCREMENTAL_DB'] ?? 'cisne_migration_torture_incremental';
const FAILURE_DB = process.env['MIGRATION_TORTURE_FAILURE_DB'] ?? 'cisne_migration_torture_failure';

async function expectPgError(run: () => Promise<unknown>, codes: string | string[]): Promise<void> {
  const expected = Array.isArray(codes) ? codes : [codes];
  await expect(run()).rejects.toSatisfy((error: unknown) => {
    const code = (error as { code?: string }).code;
    return code !== undefined && expected.includes(code);
  });
}

const DELETE_DENIED_CODES = ['23001', '23503'];

describe('Database & migration torture', () => {
  let adminClient: Client;
  let zeroUrl: string;
  let incrementalUrl: string;
  let failureUrl: string;

  beforeAll(async () => {
    if (!adminDatabaseUrl) {
      throw new Error('DATABASE_URL is required for migration torture tests.');
    }

    adminClient = new Client({ connectionString: adminDatabaseUrl });
    await adminClient.connect();

    await recreateDatabase(adminClient, ZERO_DB);
    await recreateDatabase(adminClient, INCREMENTAL_DB);
    await recreateDatabase(adminClient, FAILURE_DB);

    zeroUrl = databaseUrlForName(adminDatabaseUrl, ZERO_DB);
    incrementalUrl = databaseUrlForName(adminDatabaseUrl, INCREMENTAL_DB);
    failureUrl = databaseUrlForName(adminDatabaseUrl, FAILURE_DB);
  }, 120_000);

  afterAll(async () => {
    await adminClient?.end();
  });

  it('ZERO → LATEST: empty database applies all migrations and passes smoke', async () => {
    await applyMigrations(zeroUrl, MIGRATION_FILES);
    await assertSmokeSchema(zeroUrl);
  }, 120_000);

  it('INCREMENTAL: N-3 → N-2 → N-1 → N preserves seeded operational data', async () => {
    if (MIGRATION_FILES.length < 4) {
      throw new Error('Need at least four migrations for incremental torture.');
    }

    const nMinus3 = MIGRATION_FILES.slice(0, -3);
    const nMinus2 = MIGRATION_FILES.at(-3)!;
    const nMinus1 = MIGRATION_FILES.at(-2)!;
    const latest = MIGRATION_FILES.at(-1)!;

    await applyMigrations(incrementalUrl, nMinus3);

    const pool = new Pool({ connectionString: incrementalUrl });
    const client = await pool.connect();
    let beforeSnapshot;
    try {
      await seedPreservationFixture(client);
      beforeSnapshot = await capturePreservationSnapshot(client);
    } finally {
      client.release();
    }

    await applyMigrations(incrementalUrl, [nMinus2]);
    await applyMigrations(incrementalUrl, [nMinus1]);
    await applyMigrations(incrementalUrl, [latest]);

    const afterClient = await pool.connect();
    try {
      const afterSnapshot = await capturePreservationSnapshot(afterClient);
      expect(beforeSnapshot).toBeDefined();
      if (!beforeSnapshot) {
        throw new Error('Preservation snapshot missing before incremental migrations');
      }
      const mismatches = comparePreservationSnapshots(beforeSnapshot, afterSnapshot);
      expect(mismatches, mismatches.join('\n')).toEqual([]);
      expect(await countOrphanReferences(afterClient)).toBe(0);
    } finally {
      afterClient.release();
      await pool.end();
    }
  }, 180_000);

  it('CONSTRAINTS: direct SQL attacks are rejected by PostgreSQL invariants', async () => {
    const pool = new Pool({ connectionString: zeroUrl });
    const client = await pool.connect();
    try {
      const actorId = randomUUID();
      const definitionId = randomUUID();
      const passwordHash = '$2b$12$torture.constraint.hash.placeholder.abcdefghijklmnopqrstuvwxyz';

      await client.query(`INSERT INTO identity.identities (id, status) VALUES ($1, 'active')`, [
        actorId,
      ]);
      await client.query(
        `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized, password_hash)
         VALUES ($1, $2, $3, $4)`,
        [randomUUID(), actorId, `constraint-${actorId}@cisne.invalid`, passwordHash],
      );
      await client.query(
        `INSERT INTO cat.service_definitions (id, code, created_by_identity_id, updated_by_identity_id)
         VALUES ($1, 'CONSTRAINT-DEF', $2, $2)`,
        [definitionId, actorId],
      );

      await expectPgError(
        () =>
          client.query(
            `INSERT INTO cat.service_definitions (id, code, created_by_identity_id, updated_by_identity_id)
             VALUES ($1, 'CONSTRAINT-DEF', $2, $2)`,
            [randomUUID(), actorId],
          ),
        '23505',
      );

      await expectPgError(
        () =>
          client.query(
            `INSERT INTO cat.service_definitions (id, code, created_by_identity_id, updated_by_identity_id)
             VALUES ($1, 'MISSING-ACTOR', $2, $2)`,
            [randomUUID(), randomUUID()],
          ),
        '23503',
      );

      await expectPgError(
        () =>
          client.query(
            `INSERT INTO pty.clients (id, legal_name, normalized_tax_id, status, version)
             VALUES ($1, '', '12345678000199', 'ACTIVE', 1)`,
            [randomUUID()],
          ),
        '23514',
      );

      await expectPgError(
        () =>
          client.query(
            `INSERT INTO identity.credentials (id, identity_id, login_identifier_normalized)
             VALUES ($1, $2, $3)`,
            [randomUUID(), actorId, `missing-hash-${actorId}@cisne.invalid`],
          ),
        '23502',
      );
    } finally {
      client.release();
      await pool.end();
    }
  }, 60_000);

  it('DELETE SAFETY: historical aggregates cannot be destroyed by improper deletes', async () => {
    const pool = new Pool({ connectionString: incrementalUrl });
    const client = await pool.connect();
    try {
      const orderExists = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_orders WHERE id = $1`,
        [FIXTURE.serviceOrderId],
      );
      expect(Number(orderExists.rows[0]?.count)).toBe(1);

      await expectPgError(
        () => client.query(`DELETE FROM so.service_orders WHERE id = $1`, [FIXTURE.serviceOrderId]),
        DELETE_DENIED_CODES,
      );

      await expectPgError(
        () => client.query(`DELETE FROM pty.clients WHERE id = $1`, [FIXTURE.clientId]),
        DELETE_DENIED_CODES,
      );

      const historyCount = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_order_history_events WHERE service_order_id = $1`,
        [FIXTURE.serviceOrderId],
      );
      expect(Number(historyCount.rows[0]?.count)).toBeGreaterThan(0);

      const measurementHistory = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM msr.measurement_history_events WHERE measurement_id = $1`,
        [FIXTURE.measurementId],
      );
      expect(Number(measurementHistory.rows[0]?.count)).toBeGreaterThan(0);

      await expectPgError(
        () => client.query(`DELETE FROM msr.measurements WHERE id = $1`, [FIXTURE.measurementId]),
        DELETE_DENIED_CODES,
      );
    } finally {
      client.release();
      await pool.end();
    }
  }, 60_000);

  it('DECIMAL: financial columns remain exact numeric without float types', async () => {
    const pool = new Pool({ connectionString: incrementalUrl });
    const client = await pool.connect();
    try {
      const boundary = '99999999999999.9999';
      await client.query(`UPDATE bil.billing_records SET total_amount = $1 WHERE id = $2`, [
        boundary,
        FIXTURE.billingRecordId,
      ]);

      const amount = await client.query<{ total_amount: string }>(
        `SELECT total_amount::text FROM bil.billing_records WHERE id = $1`,
        [FIXTURE.billingRecordId],
      );
      expect(amount.rows[0]?.total_amount).toBe(boundary);

      const columnTypes = await client.query<{ column_name: string; data_type: string }>(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = 'bil'
           AND table_name = 'billing_records'
           AND column_name = 'total_amount'`,
      );
      expect(columnTypes.rows[0]?.data_type).toBe('numeric');

      const floatColumns = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM information_schema.columns
         WHERE table_schema IN ('bil', 'msr', 'com')
           AND column_name ~ '(amount|price|quantity|total)'
           AND data_type IN ('double precision', 'real')`,
      );
      expect(Number(floatColumns.rows[0]?.count)).toBe(0);
    } finally {
      client.release();
      await pool.end();
    }
  }, 60_000);

  it('MIGRATION FAILURE: failed transaction does not commit partial schema', async () => {
    const pool = new Pool({ connectionString: failureUrl });
    await applyMigrations(failureUrl, MIGRATION_FILES.slice(0, 5));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('CREATE TABLE migration_torture_probe (id integer NOT NULL)');
      try {
        await client.query('SELECT this_is_not_valid_sql');
        await client.query('COMMIT');
        throw new Error('Expected invalid SQL to abort migration transaction');
      } catch {
        await client.query('ROLLBACK');
      }
    } finally {
      client.release();
    }

    const probe = await pool.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.migration_torture_probe') AS regclass`,
    );
    expect(probe.rows[0]?.regclass).toBeNull();

    const brokenClient = await pool.connect();
    try {
      await brokenClient.query('BEGIN');
      await brokenClient.query('CREATE TABLE migration_torture_partial (id integer NOT NULL)');
      await expect(brokenClient.query('SELECT this_is_not_valid_sql')).rejects.toBeTruthy();
      await brokenClient.query('ROLLBACK');
    } finally {
      brokenClient.release();
    }

    const partial = await pool.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.migration_torture_partial') AS regclass`,
    );
    expect(partial.rows[0]?.regclass).toBeNull();

    await pool.end();
  }, 120_000);

  it('OLD APP / NEW SCHEMA: expand-only migrations keep legacy queries working', async () => {
    const pool = new Pool({ connectionString: incrementalUrl });
    const client = await pool.connect();
    try {
      const legacyClient = await client.query<{ legal_name: string }>(
        `SELECT legal_name FROM pty.clients WHERE id = $1`,
        [FIXTURE.clientId],
      );
      expect(legacyClient.rows[0]?.legal_name).toBe('Cliente Torture');

      const legacyOrders = await client.query<{ order_number: string }>(
        `SELECT order_number
         FROM so.service_orders
         WHERE unit_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        ['unit-migration-torture'],
      );
      expect(legacyOrders.rows.some((row) => row.order_number === 'SO-TORTURE-001')).toBe(true);

      const backgroundKinds = await client.query<{ enumlabel: string }>(
        `SELECT e.enumlabel
         FROM pg_type t
         INNER JOIN pg_enum e ON e.enumtypid = t.oid
         INNER JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'plt'
           AND t.typname = 'background_job_kind'
         ORDER BY e.enumsortorder`,
      );
      expect(backgroundKinds.rows.some((row) => row.enumlabel === 'NOTIFICATION')).toBe(true);
      expect(backgroundKinds.rows.some((row) => row.enumlabel === 'OPERATIONAL_ALERT_SCAN')).toBe(
        true,
      );
    } finally {
      client.release();
      await pool.end();
    }
  }, 60_000);
});
