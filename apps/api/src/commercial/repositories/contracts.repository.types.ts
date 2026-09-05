import type { ContractItemInput } from '../domain/contract.validation';

export type ClientSnapshotSource = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  normalized_tax_id: string;
  status: string;
};

export type ServiceSnapshotSource = {
  service_definition_id: string;
  service_definition_version_id: string;
  code: string;
  name: string;
  version: number;
  version_status: string;
};

export type ContractRow = {
  id: string;
  internal_code: string;
  client_id: string;
  unit_id: string;
  contract_number: string;
  title: string;
  scope_description: string | null;
  valid_from: string;
  valid_to: string | null;
  currency_code: string;
  payment_terms: string | null;
  payment_method: string | null;
  commercial_terms: Record<string, unknown>;
  client_snapshot: Record<string, unknown> | null;
  status: string;
  activated_at: string | null;
  activated_by_identity_id: string | null;
  closed_at: string | null;
  closed_by_identity_id: string | null;
  closure_reason: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type ContractItemRow = {
  id: string;
  contract_id: string;
  line_number: number;
  description: string;
  service_definition_id: string | null;
  service_definition_version_id: string | null;
  service_snapshot: Record<string, unknown> | null;
  quantity: string | null;
  unit_code: string | null;
  unit_price_amount: string | null;
  line_total_amount: string | null;
};

export type ContractDocumentLinkRow = {
  id: string;
  contract_id: string;
  document_id: string;
  link_purpose: string;
  created_at: string;
};

export type ContractHistoryEventRow = {
  id: string;
  contract_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity_id: string;
  payload: Record<string, unknown>;
};

export type CreateContractPersistenceInput = {
  internalCode: string;
  clientId: string;
  unitId: string;
  contractNumber: string;
  title: string;
  scopeDescription?: string | null;
  validFrom: string;
  validTo?: string | null;
  currencyCode: string;
  paymentTerms?: string | null;
  paymentMethod?: string | null;
  commercialTerms?: Record<string, unknown>;
  items: ContractItemInput[];
  actorIdentityId: string;
};

export type UpdateContractDraftPersistenceInput = {
  contractId: string;
  rowVersion: number;
  contractNumber?: string;
  title?: string;
  scopeDescription?: string | null | undefined;
  validFrom?: string;
  validTo?: string | null | undefined;
  currencyCode?: string;
  paymentTerms?: string | null | undefined;
  paymentMethod?: string | null | undefined;
  commercialTerms?: Record<string, unknown>;
  items?: ContractItemInput[];
  actorIdentityId: string;
};

export type ActivateContractPersistenceInput = {
  contractId: string;
  rowVersion: number;
  clientSnapshot: Record<string, unknown>;
  itemSnapshots: Array<{ lineNumber: number; serviceSnapshot: Record<string, unknown> | null }>;
  actorIdentityId: string;
};

export type CloseContractPersistenceInput = {
  contractId: string;
  rowVersion: number;
  closureReason?: string;
  actorIdentityId: string;
};

export type ExpireContractPersistenceInput = {
  contractId: string;
  actorIdentityId: string;
  /** Data de referência da expiração (default hoje, formato YYYY-MM-DD). */
  expiredAsOf?: string;
};
