import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { insertIdentity } from './identity-builders';

type DbClient = Pool | PoolClient;

export async function applyServiceCatalogMigration(client: DbClient): Promise<void> {
  const migrationPath = resolve(__dirname, '../../migrations/0007_service_catalog_baseline.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already exists')) {
        continue;
      }
      throw error;
    }
  }
}

export async function truncateCatalogTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      cat.service_evidence_requirements,
      cat.service_resource_requirements,
      cat.service_pricing_models,
      cat.service_allowed_units,
      cat.service_legal_classifications,
      cat.service_definition_versions,
      cat.service_definitions,
      cat.service_categories
    RESTART IDENTITY CASCADE
  `);
}

export type BuiltCatalogCategory = {
  categoryId: string;
  actorIdentityId: string;
};

export async function insertCatalogCategory(
  client: DbClient,
  input: {
    code?: string;
    name?: string;
    actorLogin?: string;
  } = {},
): Promise<BuiltCatalogCategory> {
  const { identityId } = await insertIdentity(client, input.actorLogin ?? `cat-actor-${randomUUID()}@test.local`);
  const categoryId = randomUUID();
  const code = input.code ?? `CAT-${randomUUID().slice(0, 8).toUpperCase()}`;

  await client.query(
    `INSERT INTO cat.service_categories (
       id, code, name, created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, $2, $3, $4, $4)`,
    [categoryId, code, input.name ?? 'Test category', identityId],
  );

  return { categoryId, actorIdentityId: identityId };
}

export type BuiltCatalogDefinition = BuiltCatalogCategory & {
  definitionId: string;
  definitionCode: string;
};

export async function insertCatalogDefinition(
  client: DbClient,
  input: {
    code?: string;
    categoryCode?: string;
    actorLogin?: string;
  } = {},
): Promise<BuiltCatalogDefinition> {
  const category = await insertCatalogCategory(client, {
    code: input.categoryCode,
    actorLogin: input.actorLogin,
  });
  const definitionId = randomUUID();
  const definitionCode = input.code ?? `SVC-${randomUUID().slice(0, 8).toUpperCase()}`;

  await client.query(
    `INSERT INTO cat.service_definitions (
       id, code, created_by_identity_id, updated_by_identity_id
     ) VALUES ($1, $2, $3, $3)`,
    [definitionId, definitionCode, category.actorIdentityId],
  );

  return {
    ...category,
    definitionId,
    definitionCode,
  };
}

export type BuiltCatalogVersion = BuiltCatalogDefinition & {
  versionId: string;
  version: number;
};

export async function insertCatalogVersion(
  client: DbClient,
  input: {
    definitionId: string;
    categoryId: string;
    actorIdentityId: string;
    version?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'RETIRED';
    name?: string;
    archetype?: string;
    measurementMode?: string;
    publish?: boolean;
  },
): Promise<BuiltCatalogVersion> {
  const version = input.version ?? 1;
  const versionId = randomUUID();
  const status = input.status ?? 'DRAFT';
  const publish = input.publish ?? status !== 'DRAFT';

  await client.query(
    `INSERT INTO cat.service_definition_versions (
       id,
       service_definition_id,
       version,
       status,
       category_id,
       archetype,
       name,
       measurement_mode,
       published_at,
       published_by_identity_id,
       retired_at,
       retired_by_identity_id,
       created_by_identity_id,
       updated_by_identity_id
     ) VALUES (
       $1, $2, $3, $4::cat.service_definition_version_status, $5,
       $6::cat.operational_archetype,
       $7,
       $8::cat.measurement_mode,
       CASE WHEN $9 THEN now() ELSE NULL END,
       CASE WHEN $9 THEN $10::uuid ELSE NULL END,
       CASE WHEN $4 = 'RETIRED' THEN now() ELSE NULL END,
       CASE WHEN $4 = 'RETIRED' THEN $10::uuid ELSE NULL END,
       $10, $10
     )`,
    [
      versionId,
      input.definitionId,
      version,
      status,
      input.categoryId,
      input.archetype ?? 'RENTAL',
      input.name ?? `Service v${version}`,
      input.measurementMode ?? 'BY_PERIOD',
      publish,
      input.actorIdentityId,
    ],
  );

  return {
    definitionId: input.definitionId,
    definitionCode: '',
    categoryId: input.categoryId,
    actorIdentityId: input.actorIdentityId,
    versionId,
    version,
  };
}
