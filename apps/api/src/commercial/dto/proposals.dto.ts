import {
  isProposalItemKind,
  isProposalPricingStructure,
} from '../domain/proposal';
import type {
  AcceptProposalInput,
  CancelProposalInput,
  CreateProposalInput,
  LinkProposalDocumentInput,
  ProposalItemInput,
  RejectProposalInput,
  UpdateProposalDraftInput,
} from '../domain/proposal.validation';
import {
  assertRecordBody,
  parseCommercialEntityListQuery,
  parseLenientRowVersionBody,
  parseLinkDocumentInput,
  parseOptionalStringField,
  parsePositiveVersionNumberParam,
  parseRequiredStringField,
} from '../../infrastructure/http/contracts';
import { assertNoPrivilegedFields } from '../../security/domain/forbidden-payload-fields';

function parseItems(raw: unknown): ProposalItemInput[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error('items invalid');
    }
    const record = item as Record<string, unknown>;
    const itemKind = parseOptionalStringField(record, 'itemKind') ?? 'OTHER';
    if (!isProposalItemKind(itemKind)) {
      throw new Error('itemKind invalid');
    }
    return {
      lineNumber: Number(record['lineNumber'] ?? index + 1),
      itemKind,
      description: parseOptionalStringField(record, 'description') ?? '',
      serviceDefinitionId:
        typeof record['serviceDefinitionId'] === 'string'
          ? record['serviceDefinitionId']
          : undefined,
      serviceDefinitionVersionId:
        typeof record['serviceDefinitionVersionId'] === 'string'
          ? record['serviceDefinitionVersionId']
          : undefined,
      quantity: typeof record['quantity'] === 'string' ? record['quantity'] : undefined,
      unitCode: typeof record['unitCode'] === 'string' ? record['unitCode'] : undefined,
      unitSalePrice:
        typeof record['unitSalePrice'] === 'string' ? record['unitSalePrice'] : undefined,
      unitInternalCost:
        typeof record['unitInternalCost'] === 'string' ? record['unitInternalCost'] : undefined,
      lineSaleAmount:
        typeof record['lineSaleAmount'] === 'string' ? record['lineSaleAmount'] : undefined,
      lineInternalCost:
        typeof record['lineInternalCost'] === 'string' ? record['lineInternalCost'] : undefined,
    };
  });
}

export function parseCreateProposalInput(body: unknown): CreateProposalInput {
  const record = assertRecordBody(body);
  assertNoPrivilegedFields(record);
  const pricingStructure = parseRequiredStringField(record, 'pricingStructure');
  if (!isProposalPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    clientId: parseRequiredStringField(record, 'clientId'),
    unitId: parseRequiredStringField(record, 'unitId'),
    title: parseRequiredStringField(record, 'title'),
    pricingStructure,
    currencyCode:
      typeof record['currencyCode'] === 'string' ? record['currencyCode'] : undefined,
    globalSalePrice:
      typeof record['globalSalePrice'] === 'string' ? record['globalSalePrice'] : undefined,
    globalInternalCost:
      typeof record['globalInternalCost'] === 'string' ? record['globalInternalCost'] : undefined,
    commercialTerms:
      record['commercialTerms'] && typeof record['commercialTerms'] === 'object'
        ? (record['commercialTerms'] as Record<string, unknown>)
        : undefined,
    validUntil: typeof record['validUntil'] === 'string' ? record['validUntil'] : undefined,
    notes: typeof record['notes'] === 'string' ? record['notes'] : undefined,
    items: parseItems(record['items']),
  };
}

export function parseUpdateProposalDraftInput(body: unknown): UpdateProposalDraftInput {
  const record = assertRecordBody(body);
  assertNoPrivilegedFields(record, { allowVersion: true, allowRowVersion: true });
  const pricingStructure =
    typeof record['pricingStructure'] === 'string' ? record['pricingStructure'] : undefined;
  if (pricingStructure && !isProposalPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    rowVersion: Number(record['rowVersion']),
    title: typeof record['title'] === 'string' ? record['title'] : undefined,
    pricingStructure:
      pricingStructure && isProposalPricingStructure(pricingStructure)
        ? pricingStructure
        : undefined,
    currencyCode:
      typeof record['currencyCode'] === 'string' ? record['currencyCode'] : undefined,
    globalSalePrice:
      record['globalSalePrice'] === null
        ? null
        : typeof record['globalSalePrice'] === 'string'
          ? record['globalSalePrice']
          : undefined,
    globalInternalCost:
      record['globalInternalCost'] === null
        ? null
        : typeof record['globalInternalCost'] === 'string'
          ? record['globalInternalCost']
          : undefined,
    commercialTerms:
      record['commercialTerms'] && typeof record['commercialTerms'] === 'object'
        ? (record['commercialTerms'] as Record<string, unknown>)
        : undefined,
    validUntil:
      record['validUntil'] === null
        ? null
        : typeof record['validUntil'] === 'string'
          ? record['validUntil']
          : undefined,
    notes:
      record['notes'] === null
        ? null
        : typeof record['notes'] === 'string'
          ? record['notes']
          : undefined,
    items: parseItems(record['items']),
  };
}

export function parseRowVersionBody(body: unknown): { rowVersion: number } {
  return parseLenientRowVersionBody(body);
}

export function parseAcceptProposalInput(body: unknown): AcceptProposalInput {
  const record = assertRecordBody(body);
  return {
    rowVersion: Number(record['rowVersion']),
    acceptanceOriginCode: parseRequiredStringField(record, 'acceptanceOriginCode'),
    acceptanceEvidenceDocumentId:
      typeof record['acceptanceEvidenceDocumentId'] === 'string'
        ? record['acceptanceEvidenceDocumentId']
        : undefined,
  };
}

export function parseRejectProposalInput(body: unknown): RejectProposalInput {
  const record = assertRecordBody(body);
  return {
    rowVersion: Number(record['rowVersion']),
    rejectionReason:
      typeof record['rejectionReason'] === 'string' ? record['rejectionReason'] : undefined,
  };
}

export function parseCancelProposalInput(body: unknown): CancelProposalInput {
  const record = assertRecordBody(body);
  return {
    rowVersion: Number(record['rowVersion']),
    cancellationReason:
      typeof record['cancellationReason'] === 'string'
        ? record['cancellationReason']
        : undefined,
  };
}

export function parseLinkProposalDocumentInput(body: unknown): LinkProposalDocumentInput {
  return parseLinkDocumentInput(body);
}

export function parseListProposalsQuery(query: Record<string, unknown>) {
  return parseCommercialEntityListQuery(query);
}

export function parseVersionNumberParam(value: string): number {
  return parsePositiveVersionNumberParam(value);
}
