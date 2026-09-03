import { useNavigate } from 'react-router-dom';
import { Dropdown } from '../../ui/Dropdown';
import type { PhysicalAsset } from '../types/physical-asset.types';

type AssetRowActionsProps = {
  asset: PhysicalAsset;
  canRead: boolean;
  canUpdate: boolean;
};

export function AssetRowActions({ asset, canRead, canUpdate }: AssetRowActionsProps) {
  const navigate = useNavigate();

  const items = [
    canRead
      ? {
          id: 'view',
          label: 'Visualizar detalhes',
          onSelect: () => navigate(`/app/assets/${asset.id}`),
        }
      : null,
    canUpdate
      ? {
          id: 'edit',
          label: 'Editar',
          onSelect: () => navigate(`/app/assets/${asset.id}/edit`),
        }
      : null,
    asset.currentAllocation
      ? {
          id: 'allocations',
          label: 'Histórico/Alocações',
          onSelect: () =>
            navigate(`/app/service-orders/${asset.currentAllocation!.serviceOrderId}/planning`),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <Dropdown
      label={`Ações para ${asset.assetCode}`}
      trigger={
        <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50">
          ···
        </span>
      }
      items={items}
    />
  );
}
