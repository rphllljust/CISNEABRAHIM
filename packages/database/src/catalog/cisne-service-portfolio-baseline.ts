import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ensureCatalogBaselineActor } from './catalog-baseline-actor';
import { normalizeCnaeCode, portfolioServiceDefinitionCode } from './cnae-code';
import {
  CISNE_PORTFOLIO_CATEGORY_CODE,
  CISNE_PORTFOLIO_CATEGORY_NAME,
  CISNE_SERVICE_PORTFOLIO,
  type CisnePortfolioEntry,
  type PortfolioOperationalArchetype,
} from './cisne-service-portfolio-data';
import { ensureUnitsOfMeasureBaseline } from './units-of-measure-baseline';

type DbClient = Pool | PoolClient;

export type CisnePortfolioSeedResult = {
  outcome: 'applied' | 'already_present';
  createdDefinitions: number;
  skippedDefinitions: number;
  totalDefinitions: number;
  categoryId: string;
};

const ARCHETYPE_MEASUREMENT_MODE: Record<PortfolioOperationalArchetype, string> = {
  RENTAL: 'BY_PERIOD',
  TRANSPORT: 'BY_EVENT',
  CIVIL_WORK: 'BY_EVENT',
  INSTALLATION: 'BY_EVENT',
  MAINTENANCE: 'BY_EVENT',
  INDUSTRIAL_SERVICE: 'BY_EVENT',
  FACILITY_SERVICE: 'BY_PERIOD',
  COMMERCIAL_REPRESENTATION: 'BY_EVENT',
  GOODS_TRADE: 'BY_QUANTITY',
  LABOR_SERVICE: 'BY_EVENT',
  WASTE_SERVICE: 'BY_EVENT',
  MARITIME_SUPPORT: 'BY_EVENT',
};

async function ensurePortfolioCategory(client: DbClient, actorIdentityId: string): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id FROM cat.service_categories WHERE code = $1`,
    [CISNE_PORTFOLIO_CATEGORY_CODE],
  );
  const categoryId = existing.rows[0]?.id;
  if (categoryId) {
    return categoryId;
  }

  const createdId = randomUUID();
  await client.query(
    `INSERT INTO cat.service_categories (
       id, code, name, created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, $2, $3, $4, $4)`,
    [createdId, CISNE_PORTFOLIO_CATEGORY_CODE, CISNE_PORTFOLIO_CATEGORY_NAME, actorIdentityId],
  );
  return createdId;
}

async function portfolioDefinitionExists(client: DbClient, definitionCode: string): Promise<boolean> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM cat.service_definitions WHERE code = $1`,
    [definitionCode],
  );
  return (result.rowCount ?? 0) > 0;
}

async function insertPortfolioDefinition(
  client: DbClient,
  entry: CisnePortfolioEntry,
  categoryId: string,
  actorIdentityId: string,
): Promise<void> {
  const definitionId = randomUUID();
  const versionId = randomUUID();
  const definitionCode = portfolioServiceDefinitionCode(entry.cnaeDisplay);
  const cnaeCode = normalizeCnaeCode(entry.cnaeDisplay);
  const measurementMode = ARCHETYPE_MEASUREMENT_MODE[entry.archetype];

  await client.query(
    `INSERT INTO cat.service_definitions (
       id, code, created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, $2, $3, $3)`,
    [definitionId, definitionCode, actorIdentityId],
  );

  await client.query(
    `INSERT INTO cat.service_definition_versions (
       id,
       service_definition_id,
       version,
       status,
       category_id,
       archetype,
       name,
       description,
       measurement_mode,
       measurement_basis,
       published_at,
       published_by_identity_id,
       created_by_identity_id,
       updated_by_identity_id
     ) VALUES (
       $1, $2, 1, 'ACTIVE'::cat.service_definition_version_status, $3,
       $4::cat.operational_archetype,
       $5,
       $6,
       $7::cat.measurement_mode,
       'UNIT'::cat.measurement_basis,
       now(),
       $8,
       $8, $8
     )`,
    [
      versionId,
      definitionId,
      categoryId,
      entry.archetype,
      entry.name,
      `Classificação CNAE ${entry.cnaeDisplay} — referência empresarial, não workflow.`,
      measurementMode,
      actorIdentityId,
    ],
  );

  await client.query(
    `INSERT INTO cat.service_legal_classifications (
       id, service_definition_version_id, scheme, code
     ) VALUES ($1, $2, 'CNAE'::cat.legal_classification_scheme, $3)`,
    [randomUUID(), versionId, cnaeCode],
  );
}

/**
 * Idempotently seeds the canonical CISNE service portfolio.
 * Does not create pricing, tax, resource, labor or evidence requirements.
 */
export async function ensureCisneServicePortfolioBaseline(
  client: DbClient,
): Promise<CisnePortfolioSeedResult> {
  await ensureUnitsOfMeasureBaseline(client);
  const actorIdentityId = await ensureCatalogBaselineActor(client);
  const categoryId = await ensurePortfolioCategory(client, actorIdentityId);

  let createdDefinitions = 0;
  let skippedDefinitions = 0;

  for (const entry of CISNE_SERVICE_PORTFOLIO) {
    const definitionCode = portfolioServiceDefinitionCode(entry.cnaeDisplay);
    if (await portfolioDefinitionExists(client, definitionCode)) {
      skippedDefinitions += 1;
      continue;
    }

    await insertPortfolioDefinition(client, entry, categoryId, actorIdentityId);
    createdDefinitions += 1;
  }

  return {
    outcome: createdDefinitions === 0 ? 'already_present' : 'applied',
    createdDefinitions,
    skippedDefinitions,
    totalDefinitions: CISNE_SERVICE_PORTFOLIO.length,
    categoryId,
  };
}

export {
  CISNE_PORTFOLIO_CATEGORY_CODE,
  CISNE_PORTFOLIO_CATEGORY_NAME,
  CISNE_SERVICE_PORTFOLIO,
} from './cisne-service-portfolio-data';
