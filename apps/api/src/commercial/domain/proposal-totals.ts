import { sumMoneyAmounts } from './money';

type ProposalItemSaleAmountValue = {
  lineSaleAmount?: string | null;
  line_sale_amount?: string | null;
};

type ProposalItemInternalCostAmountValue = {
  lineInternalCost?: string | null;
  line_internal_cost_amount?: string | null;
};

export function sumProposalItemSaleAmounts(
  items: Array<ProposalItemSaleAmountValue>,
): string | null {
  const values = items.map((item) => item.lineSaleAmount ?? item.line_sale_amount ?? null);
  if (values.every((value) => !value)) {
    return null;
  }
  return sumMoneyAmounts(values);
}

export function sumProposalItemInternalCostAmounts(
  items: Array<ProposalItemInternalCostAmountValue>,
): string | null {
  const values = items.map((item) => item.lineInternalCost ?? item.line_internal_cost_amount ?? null);
  if (values.every((value) => !value)) {
    return null;
  }
  return sumMoneyAmounts(values);
}
