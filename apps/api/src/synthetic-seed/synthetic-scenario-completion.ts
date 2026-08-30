import type { Pool, PoolClient } from 'pg';
import type { SyntheticBusinessScenario } from './synthetic-business-scenarios';
import { findSyntheticNamespaceClientId } from '@cisne/database';

type DbClient = Pool | PoolClient;

/**
 * Determines whether a namespace scenario reached its intended terminal state.
 * Incomplete runs are compensated before retry.
 */
export async function isSyntheticScenarioComplete(
  client: DbClient,
  scenario: SyntheticBusinessScenario,
): Promise<boolean> {
  const clientId = await findSyntheticNamespaceClientId(client, scenario.key);
  if (!clientId) {
    return false;
  }

  switch (scenario.flow.kind) {
    case 'client_inactive': {
      const row = await client.query<{ status: string }>(
        `SELECT status FROM pty.clients WHERE id = $1::uuid`,
        [clientId],
      );
      return row.rows[0]?.status === 'INACTIVE';
    }
    case 'proposal_draft': {
      const row = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM com.proposals WHERE client_id = $1::uuid`,
        [clientId],
      );
      return (row.rows[0]?.n ?? 0) > 0;
    }
    case 'proposal_issued':
    case 'proposal_rejected':
    case 'proposal_expired': {
      const row = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n
         FROM com.proposal_versions pv
         INNER JOIN com.proposals p ON p.id = pv.proposal_id
         WHERE p.client_id = $1::uuid AND pv.version_number = 1`,
        [clientId],
      );
      return (row.rows[0]?.n ?? 0) > 0;
    }
    case 'purchase_order_cancelled': {
      const row = await client.query<{ status: string }>(
        `SELECT status FROM com.purchase_orders WHERE client_id = $1::uuid LIMIT 1`,
        [clientId],
      );
      return row.rows[0]?.status === 'CANCELLED';
    }
    case 'service_order_cancelled': {
      const row = await client.query<{ status: string }>(
        `SELECT status FROM so.service_orders WHERE client_id = $1::uuid LIMIT 1`,
        [clientId],
      );
      return row.rows[0]?.status === 'CANCELLED';
    }
    case 'measurement_pending': {
      const row = await client.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM msr.measurements m
         INNER JOIN so.service_orders o ON o.id = m.service_order_id
         WHERE o.client_id = $1::uuid`,
        [clientId],
      );
      return (row.rows[0]?.n ?? 0) > 0;
    }
    case 'vertical': {
      const row = await client.query<{ status: string }>(
        `SELECT status FROM so.service_orders WHERE client_id = $1::uuid ORDER BY created_at DESC LIMIT 1`,
        [clientId],
      );
      const status = row.rows[0]?.status;
      if (!status) {
        return false;
      }
      const stopAfter = scenario.flow.stopAfter ?? 'complete';
      switch (stopAfter) {
        case 'prepared':
          return ['PREPARED', 'RELEASED', 'IN_EXECUTION', 'COMPLETED'].includes(status);
        case 'released':
          return ['RELEASED', 'IN_EXECUTION', 'COMPLETED'].includes(status);
        case 'completed_execution':
          return status === 'COMPLETED';
        case 'measurement_approved': {
          const approved = await client.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM msr.measurements m
             INNER JOIN so.service_orders o ON o.id = m.service_order_id
             WHERE o.client_id = $1::uuid AND m.status = 'APPROVED'`,
            [clientId],
          );
          return (approved.rows[0]?.n ?? 0) > 0;
        }
        case 'complete': {
          const billed = await client.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM bil.billing_documents bd
             INNER JOIN bil.billing_records br ON br.id = bd.billing_record_id
             INNER JOIN so.service_orders o ON o.id = br.service_order_id
             WHERE o.client_id = $1::uuid`,
            [clientId],
          );
          return (billed.rows[0]?.n ?? 0) > 0;
        }
        default:
          return false;
      }
    }
    default:
      return false;
  }
}
