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
import { assertNoPrivilegedFields } from '../../security/domain/forbidden-payload-fields';

function parseRequiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

function parseOptionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

function parseItems(raw: unknown): ProposalItemInput[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error('items invalid');
    }
    const record = item as Record<string, unknown>;
    const itemKind = parseOptionalString(record, 'itemKind') ?? 'OTHER';
    if (!isProposalItemKind(itemKind)) {
      throw new Error('itemKind invalid');
    }
    return {
      lineNumber: Number(record['lineNumber'] ?? index + 1),
      itemKind,
      description: parseOptionalString(record, 'description') ?? '',
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
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  assertNoPrivilegedFields(record);
  const pricingStructure = parseRequiredString(record, 'pricingStructure');
  if (!isProposalPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    clientId: parseRequiredString(record, 'clientId'),
    unitId: parseRequiredString(record, 'unitId'),
    title: parseRequiredString(record, 'title'),
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
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
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
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  return { rowVersion: Number((body as Record<string, unknown>)['rowVersion']) };
}

export function parseAcceptProposalInput(body: unknown): AcceptProposalInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    rowVersion: Number(record['rowVersion']),
    acceptanceOriginCode: parseRequiredString(record, 'acceptanceOriginCode'),
    acceptanceEvidenceDocumentId:
      typeof record['acceptanceEvidenceDocumentId'] === 'string'
        ? record['acceptanceEvidenceDocumentId']
        : undefined,
  };
}

export function parseRejectProposalInput(body: unknown): RejectProposalInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    rowVersion: Number(record['rowVersion']),
    rejectionReason:
      typeof record['rejectionReason'] === 'string' ? record['rejectionReason'] : undefined,
  };
}

export function parseCancelProposalInput(body: unknown): CancelProposalInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    rowVersion: Number(record['rowVersion']),
    cancellationReason:
      typeof record['cancellationReason'] === 'string'
        ? record['cancellationReason']
        : undefined,
  };
}

export function parseLinkProposalDocumentInput(body: unknown): LinkProposalDocumentInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    documentId: parseRequiredString(record, 'documentId'),
    linkPurpose: parseRequiredString(record, 'linkPurpose'),
  };
}

export function parseListProposalsQuery(query: Record<string, unknown>): {
  clientId?: string;
  unitId?: string;
  limit: number;
  offset: number;
} {
  const limitRaw = Number(query['limit'] ?? 20);
  const offsetRaw = Number(query['offset'] ?? 0);
  return {
    clientId: typeof query['clientId'] === 'string' ? query['clientId'] : undefined,
    unitId: typeof query['unitId'] === 'string' ? query['unitId'] : undefined,
    limit: Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20,
    offset: Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0,
  };
}

export function parseVersionNumberParam(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('versionNumber invalid');
  }
  return parsed;
}
