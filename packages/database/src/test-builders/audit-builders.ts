import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateSecurityAuditTables(client: DbClient): Promise<void> {
  await client.query('DELETE FROM audit.security_audit_events');
}

export async function countSecurityAuditEvents(client: DbClient): Promise<number> {
  const result = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM audit.security_audit_events',
  );
  return Number(result.rows[0]?.count ?? '0');
}
