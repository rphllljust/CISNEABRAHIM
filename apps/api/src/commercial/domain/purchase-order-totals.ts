import { sumMoneyAmounts } from './money';
import type { PurchaseOrderItemRow } from '../repositories/purchase-orders.repository.types';

export function sumPurchaseOrderItemLineTotals(items: PurchaseOrderItemRow[]): string | null {
  const values = items.map((item) => item.line_total_amount);
  if (values.every((value) => !value)) {
    return null;
  }
  return sumMoneyAmounts(values);
}
