import type {
  ProposalItemInput,
  UpdateProposalDraftInput,
} from '../domain/proposal.validation';

export type ProposalRow = {
  id: string;
  proposal_code: string;
  client_id: string;
  unit_id: string;
  title: string;
  current_version_number: number | null;
  row_version: number;
  created_at: string;
  updated_at: string;
};

export type ProposalVersionRow = {
  id: string;
  proposal_id: string;
  version_number: number;
  status: string;
  pricing_structure: string;
  currency_code: string;
  global_sale_price_amount: string | null;
  global_internal_cost_amount: string | null;
  commercial_terms: Record<string, unknown>;
  client_snapshot: Record<string, unknown> | null;
  valid_until: string | null;
  notes: string | null;
  issued_at: string | null;
  issued_by_identity_id: string | null;
  superseded_at: string | null;
  accepted_at: string | null;
  accepted_by_identity_id: string | null;
  acceptance_origin_code: string | null;
  acceptance_evidence_document_id: string | null;
  rejected_at: string | null;
  rejected_by_identity_id: string | null;
  rejection_reason: string | null;
  expired_at: string | null;
  cancelled_at: string | null;
  cancelled_by_identity_id: string | null;
  cancellation_reason: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
};

export type ProposalItemRow = {
  id: string;
  proposal_version_id: string;
  line_number: number;
  item_kind: string;
  description: string;
  service_definition_id: string | null;
  service_definition_version_id: string | null;
  service_snapshot: Record<string, unknown> | null;
  quantity: string | null;
  unit_code: string | null;
  unit_sale_price_amount: string | null;
  unit_internal_cost_amount: string | null;
  line_sale_amount: string | null;
  line_internal_cost_amount: string | null;
};

export type ProposalDocumentLinkRow = {
  id: string;
  proposal_version_id: string;
  document_id: string;
  link_purpose: string;
  created_at: string;
};

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

export type CreateProposalPersistenceInput = {
  proposalCode: string;
  clientId: string;
  unitId: string;
  title: string;
  pricingStructure: string;
  currencyCode: string;
  globalSalePrice: string | null;
  globalInternalCost: string | null;
  commercialTerms: Record<string, unknown>;
  validUntil?: string | null;
  notes?: string | null;
  items: ProposalItemInput[];
  actorIdentityId: string;
};

export type UpdateProposalDraftPersistenceInput = UpdateProposalDraftInput & {
  proposalId: string;
  versionNumber: number;
  actorIdentityId: string;
};
