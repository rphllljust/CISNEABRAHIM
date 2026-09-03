import type { PoolClient } from 'pg';
import type { ContractItemInput } from '../domain/contract.validation';
import type { ContractHistoryEventRow, ContractItemRow } from './contracts.repository.types';

export async function replaceContractItems(
  client: PoolClient,
  contractId: string,
  items: ContractItemInput[],
): Promise<ContractItemRow[]> {
  await client.query(`DELETE FROM com.contract_items WHERE contract_id = $1`, [contractId]);
  const rows: ContractItemRow[] = [];
  for (const item of items) {
    const result = await client.query<ContractItemRow>(
      `INSERT INTO com.contract_items (
         contract_id, line_number, description,
         service_definition_id, service_definition_version_id,
         quantity, unit_code, unit_price_amount, line_total_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING
         id, contract_id, line_number, description,
         service_definition_id, service_definition_version_id, service_snapshot,
         quantity::text AS quantity, unit_code,
         unit_price_amount::text AS unit_price_amount,
         line_total_amount::text AS line_total_amount`,
      [
        contractId,
        item.lineNumber,
        item.description,
        item.serviceDefinitionId ?? null,
        item.serviceDefinitionVersionId ?? null,
        item.quantity ?? null,
        item.unitCode ?? null,
        item.unitPrice ?? null,
        item.lineTotal ?? null,
      ],
    );
    const row = result.rows[0];
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}

export async function insertContractHistoryEvent(
  client: PoolClient,
  input: {
    contractId: string;
    eventType: string;
    payload?: Record<string, unknown>;
    actorIdentityId: string;
  },
): Promise<ContractHistoryEventRow> {
  const result = await client.query<ContractHistoryEventRow>(
    `INSERT INTO com.contract_history_events (
       contract_id, event_type, payload, actor_identity_id
     )
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING
       id, contract_id, event_type, occurred_at, actor_identity_id, payload`,
    [
      input.contractId,
      input.eventType,
      JSON.stringify(input.payload ?? {}),
      input.actorIdentityId,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error('CONTRACT_HISTORY_EVENT_FAILED');
  }
  return row;
}
