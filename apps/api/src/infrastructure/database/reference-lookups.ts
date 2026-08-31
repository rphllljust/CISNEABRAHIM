import type { Pool } from 'pg';

const IS_UNIT_REGISTERED_SQL = `SELECT EXISTS (
  SELECT 1 FROM "authorization".scope_refs
  WHERE scope_type = 'UNIT' AND ref_id = $1
) AS exists`;

export async function queryIsUnitRegistered(pool: Pool, unitId: string): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(IS_UNIT_REGISTERED_SQL, [unitId]);
  return result.rows[0]?.exists === true;
}