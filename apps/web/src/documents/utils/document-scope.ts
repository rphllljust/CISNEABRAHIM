import {
  linkServiceRequestDocument,
} from '../api/documents-api';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CLASSIFICATIONS,
  type DocumentLinkRef,
  type DocumentScopeContext,
  type DocumentScopeKind,
} from '../types/document.types';

export const DOCUMENT_LINK_PURPOSES = {
  Evidence: 'EVIDENCE',
  Supporting: 'SUPPORTING',
  OriginCapture: 'ORIGIN_CAPTURE',
  Attachment: 'ATTACHMENT',
  Original: 'ORIGINAL',
} as const;

const SCOPES_WITH_ENTITY_LINK = new Set<DocumentScopeKind>([
  'SERVICE_REQUEST',
  'PROPOSAL',
  'PURCHASE_ORDER',
]);

export function scopeSupportsEntityLink(kind: DocumentScopeKind): boolean {
  return SCOPES_WITH_ENTITY_LINK.has(kind);
}

export function defaultLinkPurposeForScope(scope: DocumentScopeContext): string {
  if (scope.defaultLinkPurpose) {
    return scope.defaultLinkPurpose;
  }
  switch (scope.kind) {
    case 'SERVICE_REQUEST':
      return DOCUMENT_LINK_PURPOSES.Evidence;
    case 'PROPOSAL':
      return DOCUMENT_LINK_PURPOSES.Attachment;
    case 'PURCHASE_ORDER':
      return DOCUMENT_LINK_PURPOSES.Original;
    default:
      return DOCUMENT_LINK_PURPOSES.Supporting;
  }
}

export function defaultCategoryForScope(scope: DocumentScopeContext): string {
  if (scope.categoryCode) {
    return scope.categoryCode;
  }
  switch (scope.kind) {
    case 'SERVICE_REQUEST':
    case 'EXECUTION':
    case 'MEASUREMENT':
      return DOCUMENT_CATEGORIES.Evidence;
    case 'BILLING':
      return DOCUMENT_CATEGORIES.BillingDocument;
    default:
      return DOCUMENT_CATEGORIES.General;
  }
}

export function defaultClassificationForScope(scope: DocumentScopeContext): string {
  return scope.classificationCode ?? DOCUMENT_CLASSIFICATIONS.Internal;
}

export async function linkDocumentToScope(
  scope: DocumentScopeContext,
  documentId: string,
  linkPurpose: string,
): Promise<DocumentLinkRef[]> {
  switch (scope.kind) {
    case 'SERVICE_REQUEST': {
      const detail = await linkServiceRequestDocument(scope.entityId, documentId, linkPurpose);
      return detail.documentLinks.map((link) => ({
        id: link.id,
        documentId: link.documentId,
        linkPurpose: link.linkPurpose,
        createdAt: link.createdAt,
      }));
    }
    case 'PROPOSAL':
    case 'PURCHASE_ORDER':
      throw new Error('Vinculação para este escopo ainda não disponível na interface.');
    default:
      throw new Error('Este escopo não suporta vinculação de novos documentos.');
  }
}

export function toDocumentLinkRefs(
  links: Array<{ documentId: string; linkPurpose?: string; createdAt?: string }>,
): DocumentLinkRef[] {
  return links.map((link) => ({
    documentId: link.documentId,
    linkPurpose: link.linkPurpose,
    createdAt: link.createdAt,
  }));
}
