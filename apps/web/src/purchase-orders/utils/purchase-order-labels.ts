import {
  PURCHASE_ORDER_PRICING_STRUCTURES,
  PURCHASE_ORDER_RULE_TYPES,
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderPricingStructure,
  type PurchaseOrderRuleType,
  type PurchaseOrderStatus,
} from '../types/purchase-order.types';

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PURCHASE_ORDER_STATUSES.Draft]: 'Rascunho',
  [PURCHASE_ORDER_STATUSES.Registered]: 'Registrado',
  [PURCHASE_ORDER_STATUSES.Cancelled]: 'Cancelado',
};

const PRICING_LABELS: Record<PurchaseOrderPricingStructure, string> = {
  [PURCHASE_ORDER_PRICING_STRUCTURES.LineItems]: 'Itens de linha',
  [PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal]: 'Total no cabeçalho',
};

const RULE_LABELS: Record<PurchaseOrderRuleType, string> = {
  [PURCHASE_ORDER_RULE_TYPES.PoNumberRequiredOnInvoice]: 'Nº PO obrigatório na NF',
  [PURCHASE_ORDER_RULE_TYPES.XmlRequired]: 'XML obrigatório',
  [PURCHASE_ORDER_RULE_TYPES.PdfRequired]: 'PDF obrigatório',
  [PURCHASE_ORDER_RULE_TYPES.BillingCutoff]: 'Data limite de faturamento',
  [PURCHASE_ORDER_RULE_TYPES.Recipient]: 'Destinatário de faturamento',
};

export function formatPurchaseOrderStatus(status: string): string {
  return STATUS_LABELS[status as PurchaseOrderStatus] ?? status;
}

export function formatPurchaseOrderPricingStructure(structure: string): string {
  return PRICING_LABELS[structure as PurchaseOrderPricingStructure] ?? structure;
}

export function formatBillingRuleType(ruleType: string): string {
  return RULE_LABELS[ruleType as PurchaseOrderRuleType] ?? ruleType;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}/${month}/${year}`;
  }
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatMoney(amount: string | null | undefined, currencyCode = 'BRL'): string {
  if (!amount) {
    return '—';
  }
  const numeric = Number.parseFloat(amount);
  if (Number.isNaN(numeric)) {
    return amount;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(numeric);
}

export function formatClientSnapshot(snapshot: Record<string, unknown> | null): string {
  if (!snapshot) {
    return '—';
  }
  const tradeName = snapshot['tradeName'];
  const legalName = snapshot['legalName'];
  if (typeof tradeName === 'string' && tradeName) {
    return tradeName;
  }
  if (typeof legalName === 'string' && legalName) {
    return legalName;
  }
  return '—';
}

export function formatBuyerContact(contact: Record<string, unknown>): string {
  const name = contact['name'];
  const email = contact['email'];
  const phone = contact['phone'];
  const parts: string[] = [];
  if (typeof name === 'string' && name) {
    parts.push(name);
  }
  if (typeof email === 'string' && email) {
    parts.push(email);
  }
  if (typeof phone === 'string' && phone) {
    parts.push(phone);
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}
