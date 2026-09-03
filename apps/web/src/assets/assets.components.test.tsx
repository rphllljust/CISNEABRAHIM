import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AssetOperationalStatusCell } from './components/AssetOperationalStatusCell';
import { AssetRowActions } from './components/AssetRowActions';
import { AssetSummaryStrip } from './components/AssetSummaryStrip';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
  ASSET_OPERATIONAL_AVAILABILITIES,
  type PhysicalAsset,
} from './types/physical-asset.types';

const allocatedAsset: PhysicalAsset = {
  id: 'asset-1',
  assetCode: 'TRK-001',
  resourceTypeId: 'truck',
  resourceTypeCode: 'TRUCK',
  resourceTypeClassification: 'VEHICLE',
  name: 'Caminhao pipa',
  lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
  allocationStatus: ASSET_ALLOCATION_STATUSES.Allocated,
  unitId: 'unit-a',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
  vehicle: null,
  currentAllocation: {
    serviceOrderId: 'so-1',
    orderNumber: 'OS-2026-0001',
  },
};

describe('AssetOperationalStatusCell', () => {
  it('links allocated assets to the active service order planning page', () => {
    render(
      <MemoryRouter>
        <AssetOperationalStatusCell asset={allocatedAsset} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/disponibilidade operacional: alocado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OS-2026-0001' })).toHaveAttribute(
      'href',
      '/app/service-orders/so-1/planning',
    );
  });

  it('shows inactive detail without service order link', () => {
    render(
      <AssetOperationalStatusCell
        asset={{
          ...allocatedAsset,
          lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Inactive,
          allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
          currentAllocation: null,
        }}
      />,
    );

    expect(screen.getByLabelText(/disponibilidade operacional: indispon/i)).toBeInTheDocument();
    expect(screen.getByText('Cadastro inativo')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /OS-/ })).not.toBeInTheDocument();
  });
});

describe('AssetSummaryStrip', () => {
  it('applies availability filter when a metric is selected', async () => {
    const user = userEvent.setup();
    const onSelectAvailability = vi.fn();

    render(
      <AssetSummaryStrip
        summary={{ total: 4, available: 2, allocated: 1, unavailable: 1 }}
        activeAvailabilityFilter=""
        onSelectAvailability={onSelectAvailability}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filtrar ativos alocados' }));
    expect(onSelectAvailability).toHaveBeenCalledWith(ASSET_OPERATIONAL_AVAILABILITIES.Allocated);
  });
});

describe('AssetRowActions', () => {
  it('omits allocation history when asset has no active allocation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AssetRowActions
          asset={{
            ...allocatedAsset,
            currentAllocation: null,
          }}
          canRead
          canUpdate
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Ações para TRK-001' }));
    expect(screen.queryByRole('menuitem', { name: 'Histórico/Alocações' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Visualizar detalhes' })).toBeInTheDocument();
  });
});
