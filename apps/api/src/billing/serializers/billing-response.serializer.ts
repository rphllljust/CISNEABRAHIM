import { formatMoneyAmountForApi } from '../../commercial/domain/money';
import type { BillingHistoryEventRow, BillingItemRow, BillingRecordRow } from '../repositories/billing.repository.types';

export type BillingItemResponse = {
  id: string;
  lineNumber: number;
  measurementItemId: string;
  sourceExecutionEntryId: string | null;
  unitCode: string;
  quantity: string;
  unitPrice: string | null;
  lineAmount: string;
  pricingLineSnapshot: Record<string, unknown>;
  lineLabel: string;
};

export type BillingHistoryEventResponse = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type BillingRecordDetailResponse = {
  id: string;
  serviceOrderId: string;
  measurementId: string;
  clientId: string;
  unitId: string;
  status: string;
  proposalId: string | null;
  purchaseOrderId: string | null;
  contractReference: string | null;
  clientLegalNameSnapshot: string;
  clientTaxIdSnapshot: string | null;
  billingAddressSnapshot: Record<string, unknown>;
  commercialReferenceSnapshot: Record<string, unknown>;
  currencyCode: string;
  paymentTerms: string;
  paymentTermsSource: string;
  paymentTermsAuthoritative: string | null;
  totalAmount: string;
  preparedAt: string;
  preparedByIdentityId: string;
  voidedAt: string | null;
  voidedByIdentityId: string | null;
  voidReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  items: BillingItemResponse[];
  historyEvents: BillingHistoryEventResponse[];
};

function toBillingItemResponse(row: BillingItemRow): BillingItemResponse {
  return {
    id: row.id,
    lineNumber: row.line_number,
    measurementItemId: row.measurement_item_id,
    sourceExecutionEntryId: row.source_execution_entry_id,
    unitCode: row.unit_code,
    quantity: row.quantity,
    unitPrice: row.unit_price ? formatMoneyAmountForApi(row.unit_price) : null,
    lineAmount: formatMoneyAmountForApi(row.line_amount) ?? row.line_amount,
    pricingLineSnapshot: row.pricing_line_snapshot,
    lineLabel: row.line_label,
  };
}

function toHistoryEventResponse(row: BillingHistoryEventRow): BillingHistoryEventResponse {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    occurredAt: row.occurred_at,
  };
}

export function toBillingRecordResponse(row: BillingRecordRow): Omit<BillingRecordDetailResponse, 'items' | 'historyEvents'> {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    measurementId: row.measurement_id,
    clientId: row.client_id,
    unitId: row.unit_id,
    status: row.status,
    proposalId: row.proposal_id,
    purchaseOrderId: row.purchase_order_id,
    contractReference: row.contract_reference,
    clientLegalNameSnapshot: row.client_legal_name_snapshot,
    clientTaxIdSnapshot: row.client_tax_id_snapshot,
    billingAddressSnapshot: row.billing_address_snapshot,
    commercialReferenceSnapshot: row.commercial_reference_snapshot,
    currencyCode: row.currency_code,
    paymentTerms: row.payment_terms,
    paymentTermsSource: row.payment_terms_source,
    paymentTermsAuthoritative: row.payment_terms_authoritative,
    totalAmount: formatMoneyAmountForApi(row.total_amount) ?? row.total_amount,
    preparedAt: row.prepared_at,
    preparedByIdentityId: row.prepared_by_identity_id,
    voidedAt: row.voided_at,
    voidedByIdentityId: row.voided_by_identity_id,
    voidReason: row.void_reason,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBillingRecordDetailResponse(
  row: BillingRecordRow,
  items: BillingItemRow[],
  historyEvents: BillingHistoryEventRow[],
): BillingRecordDetailResponse {
  return {
    ...toBillingRecordResponse(row),
    items: items.map(toBillingItemResponse),
    historyEvents: historyEvents.map(toHistoryEventResponse),
  };
}
