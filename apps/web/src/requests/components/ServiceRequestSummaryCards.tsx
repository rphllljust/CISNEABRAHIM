import {
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestListSummary,
  type ServiceRequestStatus,
} from '../types/service-request.types';
import { cn } from '../../ui/utils/cn';

type ServiceRequestSummaryCard = {
  id: string;
  label: string;
  value: number | null;
  filterStatus: '' | ServiceRequestStatus;
  ariaLabel: string;
};

type ServiceRequestSummaryCardsProps = {
  summary: ServiceRequestListSummary | null;
  activeStatusFilter: '' | ServiceRequestStatus;
  onSelectStatus: (status: '' | ServiceRequestStatus) => void;
};

function formatCount(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function ServiceRequestSummaryCards({
  summary,
  activeStatusFilter,
  onSelectStatus,
}: ServiceRequestSummaryCardsProps) {
  const cards: ServiceRequestSummaryCard[] = [
    {
      id: 'total',
      label: 'Total',
      value: summary?.total ?? null,
      filterStatus: '',
      ariaLabel: 'Filtrar todas as solicitações',
    },
    {
      id: 'pending',
      label: 'Pendentes',
      value: summary?.pending ?? null,
      filterStatus: SERVICE_REQUEST_STATUSES.Submitted,
      ariaLabel: 'Filtrar solicitações pendentes',
    },
    {
      id: 'under-review',
      label: 'Em análise',
      value: summary?.underReview ?? null,
      filterStatus: SERVICE_REQUEST_STATUSES.UnderReview,
      ariaLabel: 'Filtrar solicitações em análise',
    },
    {
      id: 'converted',
      label: 'Convertidas',
      value: summary?.converted ?? null,
      filterStatus: SERVICE_REQUEST_STATUSES.Converted,
      ariaLabel: 'Filtrar solicitações convertidas',
    },
    {
      id: 'cancelled',
      label: 'Canceladas',
      value: summary?.cancelled ?? null,
      filterStatus: SERVICE_REQUEST_STATUSES.Cancelled,
      ariaLabel: 'Filtrar solicitações canceladas',
    },
  ];

  return (
    <section aria-label="Resumo de solicitações" className="mb-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => {
          const isActive = activeStatusFilter === card.filterStatus;
          return (
            <button
              key={card.id}
              type="button"
              className={cn(
                'rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-gray-900/5 transition',
                'hover:bg-gray-50/80 focus-visible:cisne-focus-ring',
                isActive && 'ring-2 ring-brand-600',
              )}
              aria-label={card.ariaLabel}
              aria-pressed={isActive}
              onClick={() => onSelectStatus(card.filterStatus)}
            >
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                {formatCount(card.value)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
