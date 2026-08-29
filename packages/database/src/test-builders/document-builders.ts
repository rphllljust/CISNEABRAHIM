import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateDocumentTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      doc.document_versions,
      doc.documents,
      doc.stored_objects
    RESTART IDENTITY CASCADE
  `);
}
