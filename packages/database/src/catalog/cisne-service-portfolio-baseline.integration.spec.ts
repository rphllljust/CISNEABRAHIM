import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { normalizeCnaeCode, portfolioServiceDefinitionCode } from './cnae-code';
import {
  CISNE_PORTFOLIO_CATEGORY_CODE,
  CISNE_SERVICE_PORTFOLIO,
  ensureCisneServicePortfolioBaseline,
} from './cisne-service-portfolio-baseline';
import { applyServiceCatalogMigration, truncateCatalogTables } from '../test-builders/catalog-builders';

describe('CISNE service portfolio baseline (PostgreSQL integration)', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for portfolio baseline integration tests.');
    }
    pool = new Pool({ connectionString: testDatabaseUrl });
    await applyServiceCatalogMigration(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('seeds the full portfolio idempotently with published versions', async () => {
    await truncateCatalogTables(pool);

    const first = await ensureCisneServicePortfolioBaseline(pool);
    const second = await ensureCisneServicePortfolioBaseline(pool);

    expect(first.createdDefinitions).toBe(49);
    expect(first.skippedDefinitions).toBe(0);
    expect(first.outcome).toBe('applied');

    expect(second.createdDefinitions).toBe(0);
    expect(second.skippedDefinitions).toBe(49);
    expect(second.outcome).toBe('already_present');

    const definitions = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_definitions
       WHERE code LIKE 'CNAE-%'`,
    );
    expect(Number(definitions.rows[0]?.count)).toBe(49);

    const versions = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_definition_versions v
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'`,
    );
    expect(Number(versions.rows[0]?.count)).toBe(49);

    const published = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_definition_versions v
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'
         AND v.status = 'ACTIVE'
         AND v.published_at IS NOT NULL`,
    );
    expect(Number(published.rows[0]?.count)).toBe(49);
  });

  it('persists every expected CNAE classification without duplicates', async () => {
    await truncateCatalogTables(pool);
    await ensureCisneServicePortfolioBaseline(pool);

    const expectedCodes = CISNE_SERVICE_PORTFOLIO.map((entry) => normalizeCnaeCode(entry.cnaeDisplay));

    const rows = await pool.query<{ code: string }>(
      `SELECT lc.code
       FROM cat.service_legal_classifications lc
       INNER JOIN cat.service_definition_versions v ON v.id = lc.service_definition_version_id
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'
         AND lc.scheme = 'CNAE'`,
    );

    const persistedCodes = rows.rows.map((row) => row.code).sort();
    expect(persistedCodes).toEqual([...expectedCodes].sort());
    expect(new Set(persistedCodes).size).toBe(expectedCodes.length);
  });

  it('does not invent fiscal or operational requirements', async () => {
    await truncateCatalogTables(pool);
    await ensureCisneServicePortfolioBaseline(pool);

    const pricing = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_pricing_models pm
       INNER JOIN cat.service_definition_versions v ON v.id = pm.service_definition_version_id
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'`,
    );
    const evidence = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_evidence_requirements er
       INNER JOIN cat.service_definition_versions v ON v.id = er.service_definition_version_id
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'`,
    );
    const labor = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_labor_requirements lr
       INNER JOIN cat.service_definition_versions v ON v.id = lr.service_definition_version_id
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'`,
    );
    const resources = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM cat.service_resource_requirements rr
       INNER JOIN cat.service_definition_versions v ON v.id = rr.service_definition_version_id
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE d.code LIKE 'CNAE-%'`,
    );

    expect(Number(pricing.rows[0]?.count)).toBe(0);
    expect(Number(evidence.rows[0]?.count)).toBe(0);
    expect(Number(labor.rows[0]?.count)).toBe(0);
    expect(Number(resources.rows[0]?.count)).toBe(0);
  });

  it('groups portfolio entries under the canonical CISNE category', async () => {
    await truncateCatalogTables(pool);
    await ensureCisneServicePortfolioBaseline(pool);

    const category = await pool.query<{ code: string; definition_count: string }>(
      `SELECT c.code, COUNT(d.id)::text AS definition_count
       FROM cat.service_categories c
       INNER JOIN cat.service_definition_versions v ON v.category_id = c.id
       INNER JOIN cat.service_definitions d ON d.id = v.service_definition_id
       WHERE c.code = $1
       GROUP BY c.code`,
      [CISNE_PORTFOLIO_CATEGORY_CODE],
    );

    expect(category.rows[0]?.code).toBe(CISNE_PORTFOLIO_CATEGORY_CODE);
    expect(Number(category.rows[0]?.definition_count)).toBe(49);
  });

  it('maps terraplenagem and locação examples to expected archetypes', async () => {
    await truncateCatalogTables(pool);
    await ensureCisneServicePortfolioBaseline(pool);

    const terraplenagem = await pool.query<{ archetype: string }>(
      `SELECT v.archetype::text
       FROM cat.service_definitions d
       INNER JOIN cat.service_definition_versions v ON v.service_definition_id = d.id
       WHERE d.code = $1`,
      [portfolioServiceDefinitionCode('43.13-4-00')],
    );
    const rentalAuto = await pool.query<{ archetype: string }>(
      `SELECT v.archetype::text
       FROM cat.service_definitions d
       INNER JOIN cat.service_definition_versions v ON v.service_definition_id = d.id
       WHERE d.code = $1`,
      [portfolioServiceDefinitionCode('77.11-0-00')],
    );

    expect(terraplenagem.rows[0]?.archetype).toBe('CIVIL_WORK');
    expect(rentalAuto.rows[0]?.archetype).toBe('RENTAL');
  });
});
