export const CONTRACT_STATUSES = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Closed: 'CLOSED',
  Expired: 'EXPIRED',
} as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[keyof typeof CONTRACT_STATUSES];

export const CONTRACT_DOCUMENT_LINK_PURPOSES = {
  Contract: 'CONTRACT',
  Amendment: 'AMENDMENT',
  Supporting: 'SUPPORTING',
} as const;

export type ContractDocumentLinkPurpose =
  (typeof CONTRACT_DOCUMENT_LINK_PURPOSES)[keyof typeof CONTRACT_DOCUMENT_LINK_PURPOSES];

export const CONTRACT_HISTORY_EVENTS = {
  Created: 'CREATED',
  Updated: 'UPDATED',
  Activated: 'ACTIVATED',
  Closed: 'CLOSED',
  Expired: 'EXPIRED',
  DocumentLinked: 'DOCUMENT_LINKED',
} as const;

export type ContractHistoryEventType =
  (typeof CONTRACT_HISTORY_EVENTS)[keyof typeof CONTRACT_HISTORY_EVENTS];

const STATUS_SET = new Set<string>(Object.values(CONTRACT_STATUSES));
const LINK_PURPOSE_SET = new Set<string>(Object.values(CONTRACT_DOCUMENT_LINK_PURPOSES));

export function isContractStatus(value: string): value is ContractStatus {
  return STATUS_SET.has(value);
}

export function isContractDocumentLinkPurpose(value: string): value is ContractDocumentLinkPurpose {
  return LINK_PURPOSE_SET.has(value);
}

export function assertContractTransition(from: ContractStatus, to: ContractStatus): boolean {
  const allowed: Record<ContractStatus, ContractStatus[]> = {
    DRAFT: ['ACTIVE'],
    ACTIVE: ['CLOSED', 'EXPIRED'],
    CLOSED: [],
    EXPIRED: [],
  };
  return allowed[from].includes(to);
}

/** Status efetivo na data: um contrato ACTIVE além do valid_to é tratado como EXPIRED. */
export function effectiveContractStatus(
  contract: { status: ContractStatus; validTo: string | null },
  asOf: Date = new Date(),
): ContractStatus {
  if (contract.status === CONTRACT_STATUSES.Active && contract.validTo) {
    const today = asOf.toISOString().slice(0, 10);
    if (today > contract.validTo) {
      return CONTRACT_STATUSES.Expired;
    }
  }
  return contract.status;
}

/**
 * Histórico de contrato é append-only: eventos jamais são reescritos e estados
 * terminais (CLOSED/EXPIRED) nunca originam transição. Guarda declarativa para
 * proteger contra alteração de registros históricos.
 */
export function assertNoContractHistoryRewrite(): void {
  throw new Error('CONTRACT_HISTORY_IMMUTABLE: contract history is append-only');
}

