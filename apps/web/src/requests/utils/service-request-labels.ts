import {
  SERVICE_REQUEST_ORIGINS,
  type ServiceRequestOrigin,
  type ServiceRequestStatus,
} from '../types/service-request.types';

export const SERVICE_REQUEST_ORIGIN_LABELS: Record<ServiceRequestOrigin, string> = {
  [SERVICE_REQUEST_ORIGINS.Whatsapp]: 'WhatsApp',
  [SERVICE_REQUEST_ORIGINS.Phone]: 'Telefone',
  [SERVICE_REQUEST_ORIGINS.Email]: 'E-mail',
  [SERVICE_REQUEST_ORIGINS.PurchaseOrder]: 'Pedido de compra',
  [SERVICE_REQUEST_ORIGINS.Contract]: 'Contrato',
  [SERVICE_REQUEST_ORIGINS.ProposalAcceptance]: 'Aceite de proposta',
  [SERVICE_REQUEST_ORIGINS.DirectRequest]: 'Solicitação direta',
  [SERVICE_REQUEST_ORIGINS.Other]: 'Outro',
};

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Em análise',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
  CONVERTED: 'Convertida',
};

export function formatServiceRequestOrigin(origin: ServiceRequestOrigin): string {
  return SERVICE_REQUEST_ORIGIN_LABELS[origin] ?? origin;
}

export function formatServiceRequestStatus(status: ServiceRequestStatus): string {
  return SERVICE_REQUEST_STATUS_LABELS[status] ?? status;
}

export function formatRegisteredBy(
  createdByIdentityId: string,
  currentIdentityId: string | null,
): string {
  if (currentIdentityId && createdByIdentityId === currentIdentityId) {
    return 'Você (usuário interno)';
  }
  return `Usuário interno (${createdByIdentityId.slice(0, 8)}…)`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString('pt-BR');
}

export function formatExternalContact(contact: {
  name?: string;
  email?: string;
  phone?: string;
}): string {
  const parts = [contact.name, contact.email, contact.phone].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '—';
}
