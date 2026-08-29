export const PROPOSAL_VERSION_STATUSES = {
  Draft: 'DRAFT',
  Issued: 'ISSUED',
  Accepted: 'ACCEPTED',
  Rejected: 'REJECTED',
  Expired: 'EXPIRED',
  Cancelled: 'CANCELLED',
} as const;

export type ProposalVersionStatus =
  (typeof PROPOSAL_VERSION_STATUSES)[keyof typeof PROPOSAL_VERSION_STATUSES];

export const PROPOSAL_PRICING_STRUCTURES = {
  GlobalPrice: 'GLOBAL_PRICE',
  Itemized: 'ITEMIZED',
} as const;

export type ProposalPricingStructure =
  (typeof PROPOSAL_PRICING_STRUCTURES)[keyof typeof PROPOSAL_PRICING_STRUCTURES];

export const PROPOSAL_ITEM_KINDS = {
  Service: 'SERVICE',
  Material: 'MATERIAL',
  Labor: 'LABOR',
  Equipment: 'EQUIPMENT',
  Transport: 'TRANSPORT',
  Other: 'OTHER',
} as const;

export type ProposalItemKind = (typeof PROPOSAL_ITEM_KINDS)[keyof typeof PROPOSAL_ITEM_KINDS];

export const PROPOSAL_ACCEPTANCE_ORIGINS = {
  ClientWrittenConfirmation: 'CLIENT_WRITTEN_CONFIRMATION',
  ClientPortal: 'CLIENT_PORTAL',
  InternalApproval: 'INTERNAL_APPROVAL',
} as const;

export type ProposalAcceptanceOrigin =
  (typeof PROPOSAL_ACCEPTANCE_ORIGINS)[keyof typeof PROPOSAL_ACCEPTANCE_ORIGINS];

export const PROPOSAL_DOCUMENT_LINK_PURPOSES = {
  Attachment: 'ATTACHMENT',
  IssuedCopy: 'ISSUED_COPY',
  AcceptanceEvidence: 'ACCEPTANCE_EVIDENCE',
} as const;

export type ProposalDocumentLinkPurpose =
  (typeof PROPOSAL_DOCUMENT_LINK_PURPOSES)[keyof typeof PROPOSAL_DOCUMENT_LINK_PURPOSES];

const STATUS_SET = new Set<string>(Object.values(PROPOSAL_VERSION_STATUSES));
const PRICING_SET = new Set<string>(Object.values(PROPOSAL_PRICING_STRUCTURES));
const ITEM_KIND_SET = new Set<string>(Object.values(PROPOSAL_ITEM_KINDS));
const ACCEPTANCE_ORIGIN_SET = new Set<string>(Object.values(PROPOSAL_ACCEPTANCE_ORIGINS));
const DOCUMENT_PURPOSE_SET = new Set<string>(Object.values(PROPOSAL_DOCUMENT_LINK_PURPOSES));

export function isProposalVersionStatus(value: string): value is ProposalVersionStatus {
  return STATUS_SET.has(value);
}

export function isProposalPricingStructure(value: string): value is ProposalPricingStructure {
  return PRICING_SET.has(value);
}

export function isProposalItemKind(value: string): value is ProposalItemKind {
  return ITEM_KIND_SET.has(value);
}

export function isProposalAcceptanceOrigin(value: string): value is ProposalAcceptanceOrigin {
  return ACCEPTANCE_ORIGIN_SET.has(value);
}

export function isProposalDocumentLinkPurpose(value: string): value is ProposalDocumentLinkPurpose {
  return DOCUMENT_PURPOSE_SET.has(value);
}

export function assertTransition(
  from: ProposalVersionStatus,
  to: ProposalVersionStatus,
): boolean {
  const allowed: Record<ProposalVersionStatus, ProposalVersionStatus[]> = {
    DRAFT: ['ISSUED', 'CANCELLED'],
    ISSUED: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
    ACCEPTED: [],
    REJECTED: [],
    EXPIRED: [],
    CANCELLED: [],
  };
  return allowed[from].includes(to);
}

export function canCreateRevision(status: ProposalVersionStatus): boolean {
  return (
    status === PROPOSAL_VERSION_STATUSES.Issued ||
    status === PROPOSAL_VERSION_STATUSES.Rejected ||
    status === PROPOSAL_VERSION_STATUSES.Expired ||
    status === PROPOSAL_VERSION_STATUSES.Cancelled
  );
}

export function canEditDraft(status: ProposalVersionStatus): boolean {
  return status === PROPOSAL_VERSION_STATUSES.Draft;
}
