import {
  CONTRACT_DOCUMENT_LINK_PURPOSES,
  CONTRACT_STATUSES,
  type ContractDocumentLinkPurpose,
  type ContractStatus,
} from '../types';

const STATUS_LABELS: Record<ContractStatus, string> = {
  [CONTRACT_STATUSES.Draft]: 'Rascunho',
  [CONTRACT_STATUSES.Active]: 'Ativo',
  [CONTRACT_STATUSES.Closed]: 'Encerrado',
  [CONTRACT_STATUSES.Expired]: 'Expirado',
};

const STATUS_TONES: Record<ContractStatus, 'neutral' | 'success' | 'warning' | 'error' | 'info'> = {
  [CONTRACT_STATUSES.Draft]: 'neutral',
  [CONTRACT_STATUSES.Active]: 'success',
  [CONTRACT_STATUSES.Closed]: 'info',
  [CONTRACT_STATUSES.Expired]: 'error',
};

const LINK_PURPOSE_LABELS: Record<ContractDocumentLinkPurpose, string> = {
  [CONTRACT_DOCUMENT_LINK_PURPOSES.Contract]: 'Contrato',
  [CONTRACT_DOCUMENT_LINK_PURPOSES.Amendment]: 'Aditivo',
  [CONTRACT_DOCUMENT_LINK_PURPOSES.Supporting]: 'Suporte',
};

export function formatContractStatus(status: string): string {
  return STATUS_LABELS[status as ContractStatus] ?? status;
}

export function contractStatusTone(
  status: string,
): 'neutral' | 'success' | 'warning' | 'error' | 'info' {
  return STATUS_TONES[status as ContractStatus] ?? 'neutral';
}

export function formatContractDocumentLinkPurpose(purpose: string): string {
  return LINK_PURPOSE_LABELS[purpose as ContractDocumentLinkPurpose] ?? purpose;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/** Data de validade: 'YYYY-MM-DD' fixo do backend (sem deslocamento de fuso). */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}/${month}/${year}`;
  }
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatMoney(amount: string | null | undefined, currencyCode = 'BRL'): string {
  if (!amount) {
    return '—';
  }
  const numeric = Number.parseFloat(amount);
  if (Number.isNaN(numeric)) {
    return amount;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(numeric);
}

/** Nome legível do cliente a partir do snapshot gravado no contrato. */
export function formatClientSnapshot(snapshot: Record<string, unknown> | null): string {
  if (!snapshot) {
    return '—';
  }
  const tradeName = snapshot['tradeName'];
  const legalName = snapshot['legalName'];
  if (typeof tradeName === 'string' && tradeName) {
    return tradeName;
  }
  if (typeof legalName === 'string' && legalName) {
    return legalName;
  }
  return '—';
}
