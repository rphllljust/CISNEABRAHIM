export type ServiceSnapshotSource = {
  service_definition_id: string;
  service_definition_version_id: string;
  code: string;
  name: string;
  version: number;
  version_status: string;
  archetype: string;
  measurement_mode: string;
  measurement_basis: string;
  default_unit_code: string | null;
};

export type ServiceSnapshotAllowedUnit = {
  unit_code: string;
  is_default: boolean;
  sort_order: number;
};

export type ServiceSnapshotExecutionRequirement = {
  evidence_kind: string;
  requirement_level: string;
  config: Record<string, unknown> | null;
  sort_order: number;
};

export type ServiceSnapshotResourceRequirement = {
  physical_resource_type_code: string;
  requirement_level: string;
  min_quantity: string | null;
  sort_order: number;
};

export type ServiceSnapshotLaborRequirement = {
  labor_type_code: string;
  requirement_level: string;
  min_quantity: string | null;
  sort_order: number;
};

export type ServiceOrderServiceSnapshot = {
  serviceDefinitionId: string;
  serviceDefinitionVersionId: string;
  serviceCode: string;
  serviceName: string;
  catalogVersion: number;
  versionStatus: string;
  archetype: string;
  measurementModel: {
    mode: string;
    basis: string;
    defaultUnitCode: string | null;
  };
  allowedUnits: Array<{ unitCode: string; isDefault: boolean; sortOrder: number }>;
  requirements: {
    execution: Array<{
      evidenceKind: string;
      requirementLevel: string;
      config: Record<string, unknown> | null;
      sortOrder: number;
    }>;
    resources: Array<{
      physicalResourceTypeCode: string;
      requirementLevel: string;
      minQuantity: string | null;
      sortOrder: number;
    }>;
    labor: Array<{
      laborTypeCode: string;
      requirementLevel: string;
      minQuantity: string | null;
      sortOrder: number;
    }>;
  };
  snapshottedAt: string;
};

export function buildServiceOrderServiceSnapshot(input: {
  source: ServiceSnapshotSource;
  allowedUnits: ServiceSnapshotAllowedUnit[];
  executionRequirements: ServiceSnapshotExecutionRequirement[];
  resourceRequirements: ServiceSnapshotResourceRequirement[];
  laborRequirements: ServiceSnapshotLaborRequirement[];
}): ServiceOrderServiceSnapshot {
  return {
    serviceDefinitionId: input.source.service_definition_id,
    serviceDefinitionVersionId: input.source.service_definition_version_id,
    serviceCode: input.source.code,
    serviceName: input.source.name,
    catalogVersion: input.source.version,
    versionStatus: input.source.version_status,
    archetype: input.source.archetype,
    measurementModel: {
      mode: input.source.measurement_mode,
      basis: input.source.measurement_basis,
      defaultUnitCode: input.source.default_unit_code,
    },
    allowedUnits: input.allowedUnits.map((unit) => ({
      unitCode: unit.unit_code,
      isDefault: unit.is_default,
      sortOrder: unit.sort_order,
    })),
    requirements: {
      execution: input.executionRequirements.map((requirement) => ({
        evidenceKind: requirement.evidence_kind,
        requirementLevel: requirement.requirement_level,
        config: requirement.config,
        sortOrder: requirement.sort_order,
      })),
      resources: input.resourceRequirements.map((requirement) => ({
        physicalResourceTypeCode: requirement.physical_resource_type_code,
        requirementLevel: requirement.requirement_level,
        minQuantity: requirement.min_quantity,
        sortOrder: requirement.sort_order,
      })),
      labor: input.laborRequirements.map((requirement) => ({
        laborTypeCode: requirement.labor_type_code,
        requirementLevel: requirement.requirement_level,
        minQuantity: requirement.min_quantity,
        sortOrder: requirement.sort_order,
      })),
    },
    snapshottedAt: new Date().toISOString(),
  };
}

export type ClientSnapshotSource = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  normalized_tax_id: string;
  status: string;
};

export type ServiceOrderClientSnapshot = {
  clientId: string;
  legalName: string;
  tradeName: string | null;
  normalizedTaxId: string;
  status: string;
  snapshottedAt: string;
};

export function buildServiceOrderClientSnapshot(
  client: ClientSnapshotSource,
): ServiceOrderClientSnapshot {
  return {
    clientId: client.id,
    legalName: client.legal_name,
    tradeName: client.trade_name,
    normalizedTaxId: client.normalized_tax_id,
    status: client.status,
    snapshottedAt: new Date().toISOString(),
  };
}

export type ProposalSnapshotSource = {
  id: string;
  proposal_code: string;
  status: string;
  client_id: string;
  pricing_structure?: string | null;
  currency_code?: string | null;
  global_sale_price_amount?: string | null;
  global_internal_cost_amount?: string | null;
  commercial_terms?: Record<string, unknown> | null;
};

export type ServiceOrderProposalSnapshot = {
  proposalId: string;
  proposalNumber: string;
  status: string;
  clientId: string;
  paymentTerms?: string | null;
  contractReference?: string | null;
  pricingStructure?: string | null;
  globalSalePrice?: string | null;
  globalInternalCost?: string | null;
  currencyCode?: string | null;
  snapshottedAt: string;
};

export function buildServiceOrderProposalSnapshot(
  proposal: ProposalSnapshotSource,
): ServiceOrderProposalSnapshot {
  const commercialTerms = proposal.commercial_terms ?? {};
  const paymentTerms =
    typeof commercialTerms.paymentTerms === 'string' ? commercialTerms.paymentTerms : null;
  const contractReference =
    typeof commercialTerms.contractReference === 'string'
      ? commercialTerms.contractReference
      : null;

  return {
    proposalId: proposal.id,
    proposalNumber: proposal.proposal_code,
    status: proposal.status,
    clientId: proposal.client_id,
    paymentTerms,
    contractReference,
    pricingStructure: proposal.pricing_structure ?? null,
    globalSalePrice: proposal.global_sale_price_amount ?? null,
    globalInternalCost: proposal.global_internal_cost_amount ?? null,
    currencyCode: proposal.currency_code ?? null,
    snapshottedAt: new Date().toISOString(),
  };
}

export type PurchaseOrderSnapshotSource = {
  id: string;
  po_number: string;
  rc_number: string | null;
  status: string;
  client_id: string;
  payment_terms?: string | null;
  pricing_structure?: string | null;
  total_amount?: string | null;
  currency_code?: string | null;
};

export type ServiceOrderPurchaseOrderSnapshot = {
  purchaseOrderId: string;
  poNumber: string;
  rcNumber: string | null;
  status: string;
  clientId: string;
  paymentTerms?: string | null;
  pricingStructure?: string | null;
  totalAmount?: string | null;
  currencyCode?: string | null;
  snapshottedAt: string;
};

export function buildServiceOrderPurchaseOrderSnapshot(
  purchaseOrder: PurchaseOrderSnapshotSource,
): ServiceOrderPurchaseOrderSnapshot {
  return {
    purchaseOrderId: purchaseOrder.id,
    poNumber: purchaseOrder.po_number,
    rcNumber: purchaseOrder.rc_number,
    status: purchaseOrder.status,
    clientId: purchaseOrder.client_id,
    paymentTerms: purchaseOrder.payment_terms ?? null,
    pricingStructure: purchaseOrder.pricing_structure ?? null,
    totalAmount: purchaseOrder.total_amount ?? null,
    currencyCode: purchaseOrder.currency_code ?? null,
    snapshottedAt: new Date().toISOString(),
  };
}
