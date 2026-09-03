import {
  compareMoneyAmounts,
  moneyAmountsEqual,
  normalizeMoneyAmount,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

export const THREE_WAY_MATCH_CLASSIFICATIONS = {
  Matched: 'MATCHED',
  Partial: 'PARTIAL',
  Divergent: 'DIVERGENT',
  ReviewRequired: 'REVIEW_REQUIRED',
} as const;

export type ThreeWayMatchClassification =
  (typeof THREE_WAY_MATCH_CLASSIFICATIONS)[keyof typeof THREE_WAY_MATCH_CLASSIFICATIONS];

export const THREE_WAY_MATCH_REASONS = {
  DuplicateInvoice: 'DUPLICATE_INVOICE',
  MissingReceipt: 'MISSING_RECEIPT',
  MissingInvoice: 'MISSING_INVOICE',
  SupplierMismatch: 'SUPPLIER_MISMATCH',
  PriceMismatch: 'PRICE_MISMATCH',
  QuantityMismatch: 'QUANTITY_MISMATCH',
  AmountMismatch: 'AMOUNT_MISMATCH',
  IncompleteReceipt: 'INCOMPLETE_RECEIPT',
} as const;

export type ThreeWayMatchReason =
  (typeof THREE_WAY_MATCH_REASONS)[keyof typeof THREE_WAY_MATCH_REASONS];

export type ThreeWayMatchOrderLine = {
  id: string;
  orderedQuantity: string;
  unitAmount: string;
  lineAmount: string;
};

export type ThreeWayMatchReceiptLine = {
  spoLineId: string;
  quantity: string;
  unitAmount: string;
  lineAmount: string;
};

export type ThreeWayMatchInvoiceFact = {
  id: string;
  supplierId: string;
  totalAmount: string;
};

export type ThreeWayMatchFacts = {
  orderSupplierId: string;
  orderLines: ThreeWayMatchOrderLine[];
  receiptLines: ThreeWayMatchReceiptLine[];
  invoices: ThreeWayMatchInvoiceFact[];
};

export type ThreeWayMatchResult = {
  classification: ThreeWayMatchClassification;
  reasons: ThreeWayMatchReason[];
  orderedQuantity: string;
  receivedQuantity: string;
  orderedAmount: string;
  receivedAmount: string;
  invoicedAmount: string;
};

function uniqueReasons(reasons: ThreeWayMatchReason[]): ThreeWayMatchReason[] {
  return [...new Set(reasons)];
}

export function classifyThreeWayMatch(facts: ThreeWayMatchFacts): ThreeWayMatchResult {
  const orderedQuantity = sumMoneyAmounts(facts.orderLines.map((line) => line.orderedQuantity));
  const receivedQuantity = sumMoneyAmounts(facts.receiptLines.map((line) => line.quantity));
  const orderedAmount = sumMoneyAmounts(facts.orderLines.map((line) => line.lineAmount));
  const receivedAmount = sumMoneyAmounts(facts.receiptLines.map((line) => line.lineAmount));
  const invoicedAmount = sumMoneyAmounts(facts.invoices.map((invoice) => invoice.totalAmount));
  const reasons: ThreeWayMatchReason[] = [];

  if (facts.invoices.length === 0) {
    reasons.push(THREE_WAY_MATCH_REASONS.MissingInvoice);
  }
  if (facts.receiptLines.length === 0) {
    reasons.push(THREE_WAY_MATCH_REASONS.MissingReceipt);
  }
  if (facts.invoices.length > 1) {
    reasons.push(THREE_WAY_MATCH_REASONS.DuplicateInvoice);
  }
  if (facts.invoices.some((invoice) => invoice.supplierId !== facts.orderSupplierId)) {
    reasons.push(THREE_WAY_MATCH_REASONS.SupplierMismatch);
  }

  const byOrderLine = new Map(facts.orderLines.map((line) => [line.id, line]));
  let priceMismatch = false;
  for (const received of facts.receiptLines) {
    const ordered = byOrderLine.get(received.spoLineId);
    if (!ordered) {
      reasons.push(THREE_WAY_MATCH_REASONS.QuantityMismatch);
      continue;
    }
    if (!moneyAmountsEqual(normalizeMoneyAmount(received.unitAmount), normalizeMoneyAmount(ordered.unitAmount))) {
      priceMismatch = true;
    }
  }
  if (priceMismatch) {
    reasons.push(THREE_WAY_MATCH_REASONS.PriceMismatch);
  }

  const quantityComplete = moneyAmountsEqual(orderedQuantity, receivedQuantity);
  const quantityShort = compareMoneyAmounts(receivedQuantity, orderedQuantity) < 0;
  const quantityOver = compareMoneyAmounts(receivedQuantity, orderedQuantity) > 0;
  if (quantityOver) {
    reasons.push(THREE_WAY_MATCH_REASONS.QuantityMismatch);
  }

  const invoiceEqualsReceived = moneyAmountsEqual(invoicedAmount, receivedAmount);
  const invoiceEqualsOrdered = moneyAmountsEqual(invoicedAmount, orderedAmount);
  const receivedEqualsOrdered = moneyAmountsEqual(receivedAmount, orderedAmount);

  if (facts.invoices.length === 1 && !invoiceEqualsReceived) {
    reasons.push(THREE_WAY_MATCH_REASONS.AmountMismatch);
    if (!invoiceEqualsOrdered || quantityShort) {
      reasons.push(THREE_WAY_MATCH_REASONS.QuantityMismatch);
    }
    if (!invoiceEqualsOrdered && quantityComplete) {
      reasons.push(THREE_WAY_MATCH_REASONS.PriceMismatch);
    }
  }

  if (quantityShort && invoiceEqualsReceived) {
    reasons.push(THREE_WAY_MATCH_REASONS.IncompleteReceipt);
  }

  const unique = uniqueReasons(reasons);
  const totals = {
    orderedQuantity,
    receivedQuantity,
    orderedAmount,
    receivedAmount,
    invoicedAmount,
  };

  if (
    unique.includes(THREE_WAY_MATCH_REASONS.DuplicateInvoice) ||
    unique.includes(THREE_WAY_MATCH_REASONS.MissingInvoice) ||
    unique.includes(THREE_WAY_MATCH_REASONS.MissingReceipt) ||
    unique.includes(THREE_WAY_MATCH_REASONS.SupplierMismatch)
  ) {
    return { classification: THREE_WAY_MATCH_CLASSIFICATIONS.ReviewRequired, reasons: unique, ...totals };
  }

  if (
    unique.includes(THREE_WAY_MATCH_REASONS.PriceMismatch) ||
    unique.includes(THREE_WAY_MATCH_REASONS.AmountMismatch) ||
    unique.includes(THREE_WAY_MATCH_REASONS.QuantityMismatch)
  ) {
    return { classification: THREE_WAY_MATCH_CLASSIFICATIONS.Divergent, reasons: unique, ...totals };
  }

  if (unique.includes(THREE_WAY_MATCH_REASONS.IncompleteReceipt)) {
    return { classification: THREE_WAY_MATCH_CLASSIFICATIONS.Partial, reasons: unique, ...totals };
  }

  if (
    facts.invoices.length === 1 &&
    facts.receiptLines.length > 0 &&
    quantityComplete &&
    invoiceEqualsReceived &&
    invoiceEqualsOrdered &&
    receivedEqualsOrdered &&
    !priceMismatch
  ) {
    return { classification: THREE_WAY_MATCH_CLASSIFICATIONS.Matched, reasons: [], ...totals };
  }

  return { classification: THREE_WAY_MATCH_CLASSIFICATIONS.ReviewRequired, reasons: unique, ...totals };
}
