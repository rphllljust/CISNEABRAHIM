import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PhysicalAssetsListPage } from './PhysicalAssetsListPage';

vi.mock('../hooks/useAssetCapabilities', () => ({
  useAssetCapabilities: () => ({
    capabilities: { canCreate: true, canList: true },
    loading: false,
    error: false,
  }),
  useAssetResourceTypes: () => ({
    resourceTypes: [
      { id: 'truck', code: 'TRUCK', name: 'Caminhão', classification: 'VEHICLE', status: 'ACTIVE' },
    ],
    loading: false,
    error: false,
  }),
}));

vi.mock('../api/physical-assets-api', () => ({
  listPhysicalAssets: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'asset-1',
        assetCode: 'TRK-001',
        resourceTypeId: 'truck',
        resourceTypeCode: 'TRUCK',
        resourceTypeClassification: 'VEHICLE',
        name: 'Caminhão pipa',
        lifecycleStatus: 'ACTIVE',
        allocationStatus: 'ALLOCATED',
        unitId: 'unit-a',
        version: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deactivatedAt: null,
        vehicle: { plate: 'ABC-1234', chassis: null, model: null },
      },
    ],
    limit: 20,
    offset: 0,
  }),
}));

describe('PhysicalAssetsListPage', () => {
  it('renders lifecycle and allocation badges independently', async () => {
    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'TRK-001' })).toBeInTheDocument();
    expect(screen.getByLabelText(/status de cadastro: ativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status de alocação: alocado/i)).toBeInTheDocument();
  });
});
