import { SERVICE_ORDER_STATUSES, type ServiceOrderStatus } from '../types/service-order.types';

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  [SERVICE_ORDER_STATUSES.Draft]: 'Rascunho',
  [SERVICE_ORDER_STATUSES.Prepared]: 'Preparada',
  [SERVICE_ORDER_STATUSES.Released]: 'Liberada',
  [SERVICE_ORDER_STATUSES.InExecution]: 'Em execução',
  [SERVICE_ORDER_STATUSES.Paused]: 'Pausada',
  [SERVICE_ORDER_STATUSES.Completed]: 'Concluída',
  [SERVICE_ORDER_STATUSES.Cancelled]: 'Cancelada',
};

export function formatServiceOrderStatus(status: ServiceOrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatClientLabel(
  clientSnapshot: Record<string, unknown> | null,
  clientId: string | null,
): string {
  if (clientSnapshot) {
    const tradeName = clientSnapshot['tradeName'];
    const legalName = clientSnapshot['legalName'];
    if (typeof tradeName === 'string' && tradeName.trim()) {
      return tradeName;
    }
    if (typeof legalName === 'string' && legalName.trim()) {
      return legalName;
    }
  }
  return clientId ?? '—';
}
