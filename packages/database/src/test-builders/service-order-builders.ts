import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateServiceOrderTables(client: DbClient): Promise<void> {
  await client.query(
    `UPDATE sr.service_requests
     SET status = 'CANCELLED',
         cancellation_reason = 'integration test cleanup',
         converted_service_order_id = NULL
     WHERE converted_service_order_id IS NOT NULL`,
  );
  await client.query('DELETE FROM bil.billing_command_idempotency');
  await client.query('DELETE FROM bil.billing_history_events');
  await client.query('DELETE FROM bil.billing_items');
  await client.query('DELETE FROM bil.billing_records');
  await client.query('DELETE FROM so.execution_entry_history_events');
  await client.query('DELETE FROM so.execution_occurrences');
  await client.query('DELETE FROM so.execution_evidence');
  await client.query('DELETE FROM so.execution_entries');
  await client.query('DELETE FROM so.execution_command_idempotency');
  await client.query('DELETE FROM msr.measurement_command_idempotency');
  await client.query('DELETE FROM msr.measurement_history_events');
  await client.query('DELETE FROM msr.measurement_adjustments');
  await client.query('DELETE FROM msr.measurement_items');
  await client.query('DELETE FROM msr.measurements');
  await client.query('DELETE FROM res.resource_allocation_history_events');
  await client.query('DELETE FROM res.resource_allocations');
  await client.query('DELETE FROM so.planned_resources');
  await client.query('DELETE FROM so.service_order_history_events');
  await client.query('DELETE FROM so.service_orders');
}
