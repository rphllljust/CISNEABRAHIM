import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateCommercialProposalTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      com.proposal_document_links,
      com.proposal_items,
      com.proposal_versions,
      com.proposals
    RESTART IDENTITY CASCADE
  `);
}
