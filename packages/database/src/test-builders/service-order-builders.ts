import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateServiceOrderTables(client: DbClient): Promise<void> {
  await client.query(
    `UPDATE sr.service_requests
     SET converted_service_order_id = NULL
     WHERE converted_service_order_id IS NOT NULL`,
  );
  await client.query('DELETE FROM so.execution_entry_history_events');
  await client.query('DELETE FROM so.execution_occurrences');
  await client.query('DELETE FROM so.execution_evidence');
  await client.query('DELETE FROM so.execution_entries');
  await client.query('DELETE FROM so.execution_command_idempotency');
  await client.query('DELETE FROM res.resource_allocation_history_events');
  await client.query('DELETE FROM res.resource_allocations');
  await client.query('DELETE FROM so.planned_resources');
  await client.query('DELETE FROM so.service_order_history_events');
  await client.query('DELETE FROM so.service_orders');
}
