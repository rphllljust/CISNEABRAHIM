import type { PoolClient } from 'pg';
import {
  assertPurchaseOrderConsumptionAllowed,
  PurchaseOrderBalanceError,
  resolvePurchaseOrderAuthorizedAmount,
  type PurchaseOrderBalanceSource,
} from '../domain/purchase-order-balance';
import { PURCHASE_ORDER_STATUSES } from '../domain/purchase-order';

type LockedPurchaseOrderRow = {
  id: string;
  status: string;
  pricing_structure: string;
  total_amount: string | null;
  consumed_amount: string;
  currency_code: string;
};

export class PurchaseOrderConsumptionPersistenceError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function loadLineTotals(client: PoolClient, purchaseOrderId: string): Promise<string[]> {
  const result = await client.query<{ line_total_amount: string | null }>(
    `SELECT line_total_amount::text AS line_total_amount
     FROM com.purchase_order_items
     WHERE purchase_order_id = $1
     ORDER BY line_number ASC`,
    [purchaseOrderId],
  );
  return result.rows
    .map((row) => row.line_total_amount)
    .filter((value): value is string => Boolean(value));
}

async function lockPurchaseOrder(
  client: PoolClient,
  purchaseOrderId: string,
): Promise<LockedPurchaseOrderRow> {
  const result = await client.query<LockedPurchaseOrderRow>(
    `SELECT id, status::text AS status, pricing_structure::text AS pricing_structure,
            total_amount::text AS total_amount, consumed_amount::text AS consumed_amount,
            currency_code
     FROM com.purchase_orders
     WHERE id = $1
     FOR UPDATE`,
    [purchaseOrderId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new PurchaseOrderConsumptionPersistenceError('PURCHASE_ORDER_NOT_FOUND');
  }
  if (row.status !== PURCHASE_ORDER_STATUSES.Registered) {
    throw new PurchaseOrderConsumptionPersistenceError('PURCHASE_ORDER_INVALID_STATE');
  }
  return row;
}

export async function consumePurchaseOrderBalanceForBilling(
  client: PoolClient,
  input: {
    purchaseOrderId: string;
    billingRecordId: string;
    amount: string;
    actorIdentityId: string;
  },
): Promise<void> {
  const existing = await client.query(
    `SELECT 1
     FROM com.purchase_order_consumption_entries
     WHERE purchase_order_id = $1
       AND billing_record_id = $2
       AND entry_type = 'BILLING_PREPARE'::com.purchase_order_consumption_entry_type
     LIMIT 1`,
    [input.purchaseOrderId, input.billingRecordId],
  );
  if ((existing.rowCount ?? 0) > 0) {
    return;
  }

  const purchaseOrder = await lockPurchaseOrder(client, input.purchaseOrderId);
  const lineTotals = await loadLineTotals(client, input.purchaseOrderId);
  const balanceSource = {
    pricingStructure: purchaseOrder.pricing_structure as PurchaseOrderBalanceSource['pricingStructure'],
    totalAmount: purchaseOrder.total_amount,
    lineTotals,
    consumedAmount: purchaseOrder.consumed_amount,
  };

  try {
    assertPurchaseOrderConsumptionAllowed(balanceSource, input.amount);
  } catch (error) {
    if (error instanceof PurchaseOrderBalanceError) {
      throw new PurchaseOrderConsumptionPersistenceError(error.code);
    }
    throw error;
  }

  const updated = await client.query<{ consumed_amount: string }>(
    `UPDATE com.purchase_orders
     SET consumed_amount = consumed_amount + $2::numeric,
         updated_at = NOW()
     WHERE id = $1
     RETURNING consumed_amount::text AS consumed_amount`,
    [input.purchaseOrderId, input.amount],
  );
  const consumedAfter = updated.rows[0]?.consumed_amount;
  if (!consumedAfter) {
    throw new PurchaseOrderConsumptionPersistenceError('PURCHASE_ORDER_CONSUMPTION_FAILED');
  }

  const authorized = resolvePurchaseOrderAuthorizedAmount(balanceSource);
  if (toScaled(authorized) < toScaled(consumedAfter)) {
    throw new PurchaseOrderConsumptionPersistenceError('PURCHASE_ORDER_BALANCE_EXCEEDED');
  }

  await client.query(
    `INSERT INTO com.purchase_order_consumption_entries (
       purchase_order_id, billing_record_id, entry_type, amount, currency_code, created_by_identity_id
     ) VALUES ($1, $2, 'BILLING_PREPARE'::com.purchase_order_consumption_entry_type, $3, $4, $5)`,
    [
      input.purchaseOrderId,
      input.billingRecordId,
      input.amount,
      purchaseOrder.currency_code,
      input.actorIdentityId,
    ],
  );
}

export async function releasePurchaseOrderBalanceForBillingVoid(
  client: PoolClient,
  input: {
    purchaseOrderId: string;
    billingRecordId: string;
    amount: string;
    actorIdentityId: string;
  },
): Promise<void> {
  const existing = await client.query(
    `SELECT 1
     FROM com.purchase_order_consumption_entries
     WHERE purchase_order_id = $1
       AND billing_record_id = $2
       AND entry_type = 'BILLING_VOID'::com.purchase_order_consumption_entry_type
     LIMIT 1`,
    [input.purchaseOrderId, input.billingRecordId],
  );
  if ((existing.rowCount ?? 0) > 0) {
    return;
  }

  const prepared = await client.query<{ amount: string }>(
    `SELECT amount::text AS amount
     FROM com.purchase_order_consumption_entries
     WHERE purchase_order_id = $1
       AND billing_record_id = $2
       AND entry_type = 'BILLING_PREPARE'::com.purchase_order_consumption_entry_type
     LIMIT 1`,
    [input.purchaseOrderId, input.billingRecordId],
  );
  const preparedAmount = prepared.rows[0]?.amount ?? input.amount;

  await lockPurchaseOrder(client, input.purchaseOrderId);

  const updated = await client.query(
    `UPDATE com.purchase_orders
     SET consumed_amount = GREATEST(consumed_amount - $2::numeric, 0),
         updated_at = NOW()
     WHERE id = $1
     RETURNING consumed_amount::text AS consumed_amount`,
    [input.purchaseOrderId, preparedAmount],
  );
  if (!updated.rows[0]) {
    throw new PurchaseOrderConsumptionPersistenceError('PURCHASE_ORDER_RELEASE_FAILED');
  }

  const purchaseOrder = await client.query<{ currency_code: string }>(
    `SELECT currency_code FROM com.purchase_orders WHERE id = $1`,
    [input.purchaseOrderId],
  );

  await client.query(
    `INSERT INTO com.purchase_order_consumption_entries (
       purchase_order_id, billing_record_id, entry_type, amount, currency_code, created_by_identity_id
     ) VALUES ($1, $2, 'BILLING_VOID'::com.purchase_order_consumption_entry_type, $3, $4, $5)`,
    [
      input.purchaseOrderId,
      input.billingRecordId,
      preparedAmount,
      purchaseOrder.rows[0]?.currency_code ?? 'BRL',
      input.actorIdentityId,
    ],
  );
}

function toScaled(value: string): bigint {
  const parts = value.split('.');
  const whole = parts[0] ?? '0';
  const fraction = (parts[1] ?? '').padEnd(4, '0').slice(0, 4);
  return BigInt(whole) * 10_000n + BigInt(fraction || '0');
}
