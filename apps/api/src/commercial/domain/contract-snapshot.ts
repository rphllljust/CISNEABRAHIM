import type { ContractItemRow, ContractRow } from '../repositories/contracts.repository.types';

export type ContractOperationalItemSnapshot = {
  lineNumber: number;
  description: string;
  serviceDefinitionId: string | null;
  serviceDefinitionVersionId: string | null;
  serviceSnapshot: Record<string, unknown> | null;
  quantity: string | null;
  unitCode: string | null;
  unitPriceAmount: string | null;
  lineTotalAmount: string | null;
};

export type ContractOperationalSnapshot = {
  contractId: string;
  internalCode: string;
  contractNumber: string;
  title: string;
  clientId: string;
  unitId: string;
  status: string;
  validFrom: string;
  validTo: string | null;
  scopeDescription: string | null;
  currencyCode: string;
  paymentTerms: string | null;
  paymentMethod: string | null;
  commercialTerms: Record<string, unknown>;
  items: ContractOperationalItemSnapshot[];
  snapshottedAt: string;
};

export function buildContractOperationalSnapshot(
  contract: ContractRow,
  items: ContractItemRow[],
): ContractOperationalSnapshot {
  return {
    contractId: contract.id,
    internalCode: contract.internal_code,
    contractNumber: contract.contract_number,
    title: contract.title,
    clientId: contract.client_id,
    unitId: contract.unit_id,
    status: contract.status,
    validFrom: contract.valid_from,
    validTo: contract.valid_to,
    scopeDescription: contract.scope_description,
    currencyCode: contract.currency_code,
    paymentTerms: contract.payment_terms,
    paymentMethod: contract.payment_method,
    commercialTerms: contract.commercial_terms ?? {},
    items: items.map((item) => ({
      lineNumber: item.line_number,
      description: item.description,
      serviceDefinitionId: item.service_definition_id,
      serviceDefinitionVersionId: item.service_definition_version_id,
      serviceSnapshot: item.service_snapshot,
      quantity: item.quantity,
      unitCode: item.unit_code,
      unitPriceAmount: item.unit_price_amount,
      lineTotalAmount: item.line_total_amount,
    })),
    snapshottedAt: new Date().toISOString(),
  };
}
