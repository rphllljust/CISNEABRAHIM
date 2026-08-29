import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateClientTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      pty.client_addresses,
      pty.client_contacts,
      pty.clients
    RESTART IDENTITY CASCADE
  `);
}

export async function truncateAllOperationalTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      audit.security_audit_events,
      pty.client_addresses,
      pty.client_contacts,
      pty.clients,
      "authorization".decision_audits,
      "authorization".scoped_records,
      "authorization".grants,
      "authorization".scope_refs,
      identity.refresh_tokens,
      identity.refresh_token_families,
      identity.sessions,
      identity.credentials,
      identity.identities
    RESTART IDENTITY CASCADE
  `);
}
