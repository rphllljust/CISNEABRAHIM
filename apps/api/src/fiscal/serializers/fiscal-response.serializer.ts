import { formatMoneyAmountForApi } from '../../platform/kernel/money-math';
import type { FiscalAggregate } from '../repositories/fiscal.repository.types';

export type FiscalDocumentResponse = {
  id: string;
  unitId: string;
  status: string;
  sourceKind: string;
  sourceId: string | null;
  billingDocumentId: string | null;
  description: string;
  currencyCode: string;
  issuedOn: string;
  certificateRef: string | null;
  idempotencyKey: string;
  rowVersion: number;
  parties: Array<{
    role: string;
    legalName: string;
    taxIdentifier: string;
    partySnapshot: Record<string, unknown>;
  }>;
  items: Array<{
    lineNumber: number;
    description: string;
    quantity: string;
    unitAmount: string;
    lineAmount: string;
    itemSnapshot: Record<string, unknown>;
  }>;
  taxDetails: Array<{
    lineNumber: number;
    componentLabel: string;
    amount: string;
    detailSnapshot: Record<string, unknown>;
  }>;
  events: Array<{ eventType: string; occurredAt: string }>;
  authorizations: Array<{
    attemptNumber: number;
    gatewayId: string;
    outcome: string;
    protocolCode: string | null;
  }>;
};

export function toFiscalDocumentResponse(aggregate: FiscalAggregate): FiscalDocumentResponse {
  return {
    id: aggregate.document.id,
    unitId: aggregate.document.unit_id,
    status: aggregate.document.status,
    sourceKind: aggregate.document.source_kind,
    sourceId: aggregate.document.source_id,
    billingDocumentId: aggregate.document.billing_document_id,
    description: aggregate.document.description,
    currencyCode: aggregate.document.currency_code,
    issuedOn: aggregate.document.issued_on.slice(0, 10),
    certificateRef: aggregate.document.certificate_ref,
    idempotencyKey: aggregate.document.idempotency_key,
    rowVersion: aggregate.document.row_version,
    parties: aggregate.parties.map((party) => ({
      role: party.role,
      legalName: party.legal_name,
      taxIdentifier: party.tax_identifier,
      partySnapshot: party.party_snapshot,
    })),
    items: aggregate.items.map((item) => ({
      lineNumber: item.line_number,
      description: item.description,
      quantity: formatMoneyAmountForApi(item.quantity) ?? item.quantity,
      unitAmount: formatMoneyAmountForApi(item.unit_amount) ?? item.unit_amount,
      lineAmount: formatMoneyAmountForApi(item.line_amount) ?? item.line_amount,
      itemSnapshot: item.item_snapshot,
    })),
    taxDetails: aggregate.taxDetails.map((detail) => ({
      lineNumber: detail.line_number,
      componentLabel: detail.component_label,
      amount: formatMoneyAmountForApi(detail.amount) ?? detail.amount,
      detailSnapshot: detail.detail_snapshot,
    })),
    events: aggregate.events.map((event) => ({
      eventType: event.event_type,
      occurredAt: event.occurred_at,
    })),
    authorizations: aggregate.authorizations.map((authorization) => ({
      attemptNumber: authorization.attempt_number,
      gatewayId: authorization.gateway_id,
      outcome: authorization.outcome,
      protocolCode: authorization.protocol_code,
    })),
  };
}
