import type { PoolClient } from 'pg';

/**
 * Transactional participation boundary for service-order allocation (ADR-003).
 * Only resources module locks ast.physical_assets rows.
 */
export type LockedPhysicalAssetForAllocationRow = {
  id: string;
  asset_code: string;
  resource_type_code: string;
  lifecycle_status: string;
  unit_id: string;
};

export async function lockPhysicalAssetForAllocation(
  client: PoolClient,
  assetId: string,
): Promise<LockedPhysicalAssetForAllocationRow | null> {
  const result = await client.query<LockedPhysicalAssetForAllocationRow>(
    `SELECT
       a.id,
       a.asset_code,
       rt.code AS resource_type_code,
       a.lifecycle_status::text AS lifecycle_status,
       a.unit_id
     FROM ast.physical_assets a
     INNER JOIN cat.physical_resource_types rt ON rt.id = a.physical_resource_type_id
     WHERE a.id = $1
     FOR UPDATE`,
    [assetId],
  );
  return result.rows[0] ?? null;
}