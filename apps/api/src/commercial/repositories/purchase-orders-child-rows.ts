import type { PoolClient } from 'pg';
import type { PurchaseOrderItemInput } from '../domain/purchase-order.validation';
import type { PurchaseOrderBillingRuleRow, PurchaseOrderItemRow } from './purchase-orders.repository.types';

export async function replacePurchaseOrderItems(
  client: PoolClient,
  purchaseOrderId: string,
  items: PurchaseOrderItemInput[],
): Promise<PurchaseOrderItemRow[]> {
  await client.query(`DELETE FROM com.purchase_order_items WHERE purchase_order_id = $1`, [purchaseOrderId]);
  const rows: PurchaseOrderItemRow[] = [];
  for (const item of items) {
    const result = await client.query<PurchaseOrderItemRow>(
      `INSERT INTO com.purchase_order_items (
         purchase_order_id, line_number, description,
         service_definition_id, service_definition_version_id,
         quantity, unit_code, unit_price_amount, line_total_amount, rc_line_reference
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING
         id, purchase_order_id, line_number, description,
         service_definition_id, service_definition_version_id, service_snapshot,
         quantity::text AS quantity, unit_code,
         unit_price_amount::text AS unit_price_amount,
         line_total_amount::text AS line_total_amount, rc_line_reference`,
      [
        purchaseOrderId,
        item.lineNumber,
        item.description,
        item.serviceDefinitionId ?? null,
        item.serviceDefinitionVersionId ?? null,
        item.quantity ?? null,
        item.unitCode ?? null,
        item.unitPrice ?? null,
        item.lineTotal ?? null,
        item.rcLineReference ?? null,
      ],
    );
    const row = result.rows[0];
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}

export async function replacePurchaseOrderBillingRules(
  client: PoolClient,
  purchaseOrderId: string,
  rules: Array<{ ruleType: string; ruleConfig?: Record<string, unknown> }>,
  actorIdentityId: string,
): Promise<PurchaseOrderBillingRuleRow[]> {
  await client.query(`DELETE FROM com.purchase_order_billing_rules WHERE purchase_order_id = $1`, [
    purchaseOrderId,
  ]);
  const rows: PurchaseOrderBillingRuleRow[] = [];
  for (const rule of rules) {
    const result = await client.query<PurchaseOrderBillingRuleRow>(
      `INSERT INTO com.purchase_order_billing_rules (
         purchase_order_id, rule_type, rule_config, precedence_tier, created_by_identity_id
       )
       VALUES ($1, $2::com.purchase_order_rule_type, $3, 'PURCHASE_ORDER', $4)
       RETURNING id, purchase_order_id, rule_type::text AS rule_type, rule_config, precedence_tier, created_at`,
      [purchaseOrderId, rule.ruleType, JSON.stringify(rule.ruleConfig ?? {}), actorIdentityId],
    );
    const row = result.rows[0];
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}
