import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  applyServiceCatalogMigration,
  insertCatalogCategory,
  insertCatalogDefinition,
  insertCatalogVersion,
  truncateCatalogTables,
  ensureUnitsOfMeasureBaseline,
} from './test-builders/catalog-builders';

const CATALOG_TABLES = [
  'physical_resource_types',
  'service_allowed_units',
  'service_categories',
  'service_definition_versions',
  'service_definitions',
  'service_evidence_requirements',
  'service_legal_classifications',
  'service_pricing_models',
  'service_resource_requirements',
  'units_of_measure',
] as const;

describe('Service catalog persistence migration', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for service catalog persistence tests.');
    }
    pool = new Pool({ connectionString: testDatabaseUrl });
    await applyServiceCatalogMigration(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('applies service catalog migration on empty-compatible database', async () => {
    await applyServiceCatalogMigration(pool);

    const tables = await pool.query<{ tablename: string }>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'cat'
       ORDER BY tablename`,
    );

    expect(tables.rows.map((row) => row.tablename)).toEqual([...CATALOG_TABLES]);
  });

  it('upgrades incrementally without destroying existing identity data', async () => {
    const before = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM identity.identities`,
    );
    const identitiesBefore = Number(before.rows[0]?.count ?? '0');

    await applyServiceCatalogMigration(pool);

    const after = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM identity.identities`,
    );
    expect(Number(after.rows[0]?.count)).toBe(identitiesBefore);

    const trigger = await pool.query<{ tgname: string }>(
      `SELECT tgname
       FROM pg_trigger
       WHERE tgname = 'service_definition_versions_immutability_trg'`,
    );
    expect(trigger.rows).toHaveLength(1);
  });

  it('rejects duplicate service definition code', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool, { code: 'RENTAL-AUTO-DAILY' });

    await expect(
      pool.query(
        `INSERT INTO cat.service_definitions (id, code, created_by_identity_id, updated_by_identity_id)
         VALUES ($1, $2, $3, $3)`,
        [randomUUID(), 'RENTAL-AUTO-DAILY', built.actorIdentityId],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('enforces version uniqueness per service definition lineage', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);

    await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 1,
    });

    await expect(
      insertCatalogVersion(pool, {
        definitionId: built.definitionId,
        categoryId: built.categoryId,
        actorIdentityId: built.actorIdentityId,
        version: 1,
        name: 'Duplicate version number',
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('allows semantic evolution via new version rows', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);

    const v1 = await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 1,
      status: 'ACTIVE',
      name: 'Locação diária v1',
      publish: true,
    });

    const v2 = await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 2,
      status: 'DRAFT',
      name: 'Locação diária v2',
      publish: false,
    });

    const rows = await pool.query<{ version: number; name: string }>(
      `SELECT version, name
       FROM cat.service_definition_versions
       WHERE service_definition_id = $1
       ORDER BY version`,
      [built.definitionId],
    );

    expect(rows.rows).toEqual([
      { version: 1, name: 'Locação diária v1' },
      { version: 2, name: 'Locação diária v2' },
    ]);

    expect(v1.versionId).not.toBe(v2.versionId);
  });

  it('rejects invalid foreign key references', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);
    const missingCategoryId = randomUUID();

    await expect(
      pool.query(
        `INSERT INTO cat.service_definition_versions (
           id, service_definition_id, version, category_id, archetype, name,
           measurement_mode, created_by_identity_id, updated_by_identity_id
         ) VALUES (
           $1, $2, 1, $3, 'RENTAL'::cat.operational_archetype, 'Invalid category',
           'BY_PERIOD'::cat.measurement_mode, $4, $4
         )`,
        [randomUUID(), built.definitionId, missingCategoryId, built.actorIdentityId],
      ),
    ).rejects.toMatchObject({ code: '23503' });

    await expect(
      pool.query(
        `INSERT INTO cat.service_legal_classifications (
           id, service_definition_version_id, scheme, code
         ) VALUES ($1, $2, 'CNAE'::cat.legal_classification_scheme, '7711001')`,
        [randomUUID(), randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('rolls back catalog inserts transactionally in test environment', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogCategory(pool, { code: 'TX-ROLLBACK' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO cat.service_definitions (
           id, code, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, 'TX-DEF', $2, $2)`,
        [randomUUID(), built.actorIdentityId],
      );
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_definitions
       WHERE code = 'TX-DEF'`,
    );
    expect(Number(count.rows[0]?.count)).toBe(0);
  });

  it('prevents silent overwrite of published service definition versions', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);
    const version = await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 1,
      status: 'ACTIVE',
      name: 'Published name',
      publish: true,
    });

    await expect(
      pool.query(
        `UPDATE cat.service_definition_versions
         SET name = 'Silently changed'
         WHERE id = $1`,
        [version.versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const current = await pool.query<{ name: string }>(
      `SELECT name FROM cat.service_definition_versions WHERE id = $1`,
      [version.versionId],
    );
    expect(current.rows[0]?.name).toBe('Published name');
  });

  it('persists child rows bound to the correct version', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);
    const v1 = await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 1,
      status: 'ACTIVE',
      publish: true,
    });

    await pool.query(
      `INSERT INTO cat.service_allowed_units (
         id, service_definition_version_id, unit_code, is_default, sort_order
       ) VALUES ($1, $2, 'DAY', true, 0)`,
      [randomUUID(), v1.versionId],
    );

    await pool.query(
      `INSERT INTO cat.service_legal_classifications (
         id, service_definition_version_id, scheme, code
       ) VALUES ($1, $2, 'CNAE'::cat.legal_classification_scheme, '7711001')`,
      [randomUUID(), v1.versionId],
    );

    await pool.query(
      `INSERT INTO cat.service_pricing_models (
         id, service_definition_version_id, pricing_model_code, sort_order
       ) VALUES ($1, $2, 'PER_PERIOD'::cat.pricing_model_code, 0)`,
      [randomUUID(), v1.versionId],
    );

    await pool.query(
      `INSERT INTO cat.service_resource_requirements (
         id, service_definition_version_id, physical_resource_type_code, requirement_level, min_quantity, sort_order
       ) VALUES ($1, $2, 'WATER_TRUCK', 'REQUIRED'::cat.requirement_level, 1, 0)`,
      [randomUUID(), v1.versionId],
    );

    await pool.query(
      `INSERT INTO cat.service_evidence_requirements (
         id, service_definition_version_id, evidence_kind, requirement_level, sort_order
       ) VALUES ($1, $2, 'PHOTO'::cat.evidence_kind, 'REQUIRED'::cat.requirement_level, 0)`,
      [randomUUID(), v1.versionId],
    );

    const childCounts = await pool.query<{ table_name: string; count: string }>(
      `SELECT 'allowed_units' AS table_name, COUNT(*)::text AS count
       FROM cat.service_allowed_units WHERE service_definition_version_id = $1
       UNION ALL
       SELECT 'legal', COUNT(*)::text
       FROM cat.service_legal_classifications WHERE service_definition_version_id = $1
       UNION ALL
       SELECT 'pricing', COUNT(*)::text
       FROM cat.service_pricing_models WHERE service_definition_version_id = $1
       UNION ALL
       SELECT 'resource', COUNT(*)::text
       FROM cat.service_resource_requirements WHERE service_definition_version_id = $1
       UNION ALL
       SELECT 'evidence', COUNT(*)::text
       FROM cat.service_evidence_requirements WHERE service_definition_version_id = $1`,
      [v1.versionId],
    );

    expect(childCounts.rows.map((row) => Number(row.count))).toEqual([1, 1, 1, 1, 1]);
  });

  it('rejects service_allowed_units with unknown unit_code', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);
    const v1 = await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 1,
      status: 'DRAFT',
      publish: false,
    });

    await expect(
      pool.query(
        `INSERT INTO cat.service_allowed_units (
           id, service_definition_version_id, unit_code, is_default, sort_order
         ) VALUES ($1, $2, 'UNKNOWN_UNIT', true, 0)`,
        [randomUUID(), v1.versionId],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('rejects service_resource_requirements with unknown physical_resource_type_code', async () => {
    await truncateCatalogTables(pool);
    const built = await insertCatalogDefinition(pool);
    const v1 = await insertCatalogVersion(pool, {
      definitionId: built.definitionId,
      categoryId: built.categoryId,
      actorIdentityId: built.actorIdentityId,
      version: 1,
      status: 'DRAFT',
      publish: false,
    });

    await expect(
      pool.query(
        `INSERT INTO cat.service_resource_requirements (
           id, service_definition_version_id, physical_resource_type_code, requirement_level, min_quantity, sort_order
         ) VALUES ($1, $2, 'UNKNOWN_TYPE', 'REQUIRED'::cat.requirement_level, 1, 0)`,
        [randomUUID(), v1.versionId],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('seeds baseline units idempotently', async () => {
    await truncateCatalogTables(pool);
    const first = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM cat.units_of_measure`,
    );
    await ensureUnitsOfMeasureBaseline(pool);
    const second = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM cat.units_of_measure`,
    );
    expect(Number(second.rows[0]?.count)).toBe(Number(first.rows[0]?.count));
    expect(Number(second.rows[0]?.count)).toBeGreaterThanOrEqual(13);
  });
});
