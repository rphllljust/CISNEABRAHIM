import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

/** Stable identity for catalog baseline seeds (portfolio, reference data). */
export const CATALOG_BASELINE_ACTOR_ID = 'a0000001-0000-4000-8000-000000000001';

export async function ensureCatalogBaselineActor(client: DbClient): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `SELECT id FROM identity.identities WHERE id = $1`,
    [CATALOG_BASELINE_ACTOR_ID],
  );

  if ((existing.rowCount ?? 0) > 0) {
    return CATALOG_BASELINE_ACTOR_ID;
  }

  await client.query(
    `INSERT INTO identity.identities (id, status)
     VALUES ($1, 'active')
     ON CONFLICT (id) DO NOTHING`,
    [CATALOG_BASELINE_ACTOR_ID],
  );

  return CATALOG_BASELINE_ACTOR_ID;
}

/**
 * Resolves an actor for catalog seeds in tests when a dedicated baseline actor is unavailable.
 */
export async function resolveCatalogSeedActor(client: DbClient): Promise<string> {
  const baseline = await client.query<{ id: string }>(
    `SELECT id FROM identity.identities WHERE id = $1`,
    [CATALOG_BASELINE_ACTOR_ID],
  );
  if ((baseline.rowCount ?? 0) > 0) {
    return CATALOG_BASELINE_ACTOR_ID;
  }

  const anyIdentity = await client.query<{ id: string }>(
    `SELECT id FROM identity.identities ORDER BY created_at ASC LIMIT 1`,
  );
  const identityId = anyIdentity.rows[0]?.id;
  if (identityId) {
    return identityId;
  }

  const createdId = randomUUID();
  await client.query(
    `INSERT INTO identity.identities (id, status) VALUES ($1, 'active')`,
    [createdId],
  );
  return createdId;
}
