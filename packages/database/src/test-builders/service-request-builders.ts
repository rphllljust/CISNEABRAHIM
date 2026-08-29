import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateServiceRequestTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      sr.service_request_document_links,
      sr.service_requests
    RESTART IDENTITY CASCADE
  `);
}
