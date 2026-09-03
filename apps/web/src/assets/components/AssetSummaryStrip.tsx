import {
  ASSET_OPERATIONAL_AVAILABILITIES,
  type AssetOperationalAvailability,
  type PhysicalAssetListSummary,
} from '../types/physical-asset.types';
import { formatAssetCount } from '../utils/asset-operational-status';
import { cn } from '../../ui/utils/cn';

type AssetSummaryMetric = {
  id: string;
  label: string;
  value: number | null;
  filterAvailability: '' | AssetOperationalAvailability;
  ariaLabel: string;
};

type AssetSummaryStripProps = {
  summary: PhysicalAssetListSummary | null;
  activeAvailabilityFilter: '' | AssetOperationalAvailability;
  onSelectAvailability: (availability: '' | AssetOperationalAvailability) => void;
};

export function AssetSummaryStrip({
  summary,
  activeAvailabilityFilter,
  onSelectAvailability,
}: AssetSummaryStripProps) {
  const metrics: AssetSummaryMetric[] = [
    {
      id: 'total',
      label: 'Total de ativos',
      value: summary?.total ?? null,
      filterAvailability: '',
      ariaLabel: 'Mostrar todos os ativos',
    },
    {
      id: 'available',
      label: 'Disponíveis',
      value: summary?.available ?? null,
      filterAvailability: ASSET_OPERATIONAL_AVAILABILITIES.Available,
      ariaLabel: 'Filtrar ativos disponíveis',
    },
    {
      id: 'allocated',
      label: 'Alocados',
      value: summary?.allocated ?? null,
      filterAvailability: ASSET_OPERATIONAL_AVAILABILITIES.Allocated,
      ariaLabel: 'Filtrar ativos alocados',
    },
    {
      id: 'unavailable',
      label: 'Indisponíveis',
      value: summary?.unavailable ?? null,
      filterAvailability: ASSET_OPERATIONAL_AVAILABILITIES.Unavailable,
      ariaLabel: 'Filtrar ativos indisponíveis',
    },
  ];

  return (
    <section aria-label="Indicadores de ativos" className="mb-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-gray-900/5 sm:grid-cols-4">
        {metrics.map((metric) => {
          const isActive = activeAvailabilityFilter === metric.filterAvailability;
          return (
            <button
              key={metric.id}
              type="button"
              className={cn(
                'rounded-md px-3 py-2 text-left transition',
                'hover:bg-gray-50 focus-visible:cisne-focus-ring',
                isActive && 'bg-brand-50 ring-1 ring-brand-200',
              )}
              aria-label={metric.ariaLabel}
              aria-pressed={isActive}
              onClick={() => onSelectAvailability(metric.filterAvailability)}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {metric.label}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
                {metric.value === null ? '—' : formatAssetCount(metric.value)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
