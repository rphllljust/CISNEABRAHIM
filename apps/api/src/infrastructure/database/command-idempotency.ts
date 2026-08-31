import type { PoolClient, QueryResultRow } from 'pg';

export type CommandIdempotencyLookup = {
  tableFqn: string;
  scopeColumn: string;
  scopeValue: string;
  commandName: string;
  idempotencyKey: string;
  returning?: string;
};

const DEFAULT_RETURNING = 'id, response_payload, created_at';

export async function findStoredCommandIdempotency<T extends QueryResultRow>(
  client: PoolClient,
  lookup: CommandIdempotencyLookup,
): Promise<T | null> {
  const returning = lookup.returning ?? DEFAULT_RETURNING;
  const result = await client.query<T>(
    `SELECT ${returning}
     FROM ${lookup.tableFqn}
     WHERE ${lookup.scopeColumn} = $1
       AND command_name = $2
       AND idempotency_key = $3`,
    [lookup.scopeValue, lookup.commandName, lookup.idempotencyKey],
  );
  return result.rows[0] ?? null;
}

export type StoreCommandIdempotencyInput = {
  tableFqn: string;
  columns: Record<string, unknown>;
  jsonPayloadColumns?: string[];
};

export async function storeCommandIdempotency(
  client: PoolClient,
  input: StoreCommandIdempotencyInput,
): Promise<void> {
  const entries = Object.entries(input.columns);
  const columnNames = entries.map(([name]) => name).join(', ');
  const jsonColumns = new Set(input.jsonPayloadColumns ?? []);
  const placeholders = entries
    .map((_, index) => (jsonColumns.has(entries[index]![0]) ? `$${index + 1}::jsonb` : `$${index + 1}`))
    .join(', ');
  const values = entries.map(([name, value]) =>
    jsonColumns.has(name) ? JSON.stringify(value) : value,
  );

  await client.query(
    `INSERT INTO ${input.tableFqn} (${columnNames}) VALUES (${placeholders})`,
    values,
  );
}