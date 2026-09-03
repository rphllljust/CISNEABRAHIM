import { formatMoneyAmountForApi } from '../domain/money';
import {
  toDocumentLinkResponse as toSharedDocumentLinkResponse,
  type DocumentLinkResponse,
} from '../../infrastructure/http/contracts';
import type {
  ContractDocumentLinkRow,
  ContractItemRow,
  ContractRow,
} from '../repositories/contracts.repository.types';

export type ContractItemResponse = {
  id: string;
  lineNumber: number;
  description: string;
  serviceDefinitionId: string | null;
  serviceDefinitionVersionId: string | null;
  serviceSnapshot: Record<string, unknown> | null;
  quantity: string | null;
  unitCode: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
};

export type ContractDocumentLinkResponse = DocumentLinkResponse;

export type ContractResponse = {
  id: string;
  internalCode: string;
  clientId: string;
  unitId: string;
  contractNumber: string;
  title: string;
  scopeDescription: string | null;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  paymentTerms: string | null;
  paymentMethod: string | null;
  commercialTerms: Record<string, unknown>;
  clientSnapshot: Record<string, unknown> | null;
  status: string;
  activatedAt: string | null;
  closedAt: string | null;
  closureReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ContractDetailResponse = {
  contract: ContractResponse;
  items: ContractItemResponse[];
  documentLinks: ContractDocumentLinkResponse[];
};

function toItemResponse(row: ContractItemRow): ContractItemResponse {
  return {
    id: row.id,
    lineNumber: row.line_number,
    description: row.description,
    serviceDefinitionId: row.service_definition_id,
    serviceDefinitionVersionId: row.service_definition_version_id,
    serviceSnapshot: row.service_snapshot,
    quantity: formatMoneyAmountForApi(row.quantity),
    unitCode: row.unit_code,
    unitPrice: formatMoneyAmountForApi(row.unit_price_amount),
    lineTotal: formatMoneyAmountForApi(row.line_total_amount),
  };
}

function toDocumentLinkResponse(row: ContractDocumentLinkRow): ContractDocumentLinkResponse {
  return toSharedDocumentLinkResponse(row);
}

export function toContractResponse(row: ContractRow): ContractResponse {
  return {
    id: row.id,
    internalCode: row.internal_code,
    clientId: row.client_id,
    unitId: row.unit_id,
    contractNumber: row.contract_number,
    title: row.title,
    scopeDescription: row.scope_description,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    currencyCode: row.currency_code,
    paymentTerms: row.payment_terms,
    paymentMethod: row.payment_method,
    commercialTerms: row.commercial_terms ?? {},
    clientSnapshot: row.client_snapshot,
    status: row.status,
    activatedAt: row.activated_at,
    closedAt: row.closed_at,
    closureReason: row.closure_reason,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toContractDetailResponse(
  contract: ContractRow,
  items: ContractItemRow[],
  documentLinks: ContractDocumentLinkRow[],
): ContractDetailResponse {
  return {
    contract: toContractResponse(contract),
    items: items.map(toItemResponse),
    documentLinks: documentLinks.map(toDocumentLinkResponse),
  };
}
