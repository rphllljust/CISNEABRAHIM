import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhysicalAssetsListPage } from './PhysicalAssetsListPage';
import { ASSET_OPERATIONAL_AVAILABILITIES } from '../types/physical-asset.types';

const { mockListPhysicalAssets, mockGetPhysicalAssetSummary } = vi.hoisted(() => ({
  mockListPhysicalAssets: vi.fn(),
  mockGetPhysicalAssetSummary: vi.fn(),
}));

vi.mock('../hooks/useAssetCapabilities', () => ({
  useAssetCapabilities: () => ({
    capabilities: { canCreate: true, canList: true, canRead: true, canUpdate: true },
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
  listPhysicalAssets: mockListPhysicalAssets,
  getPhysicalAssetSummary: mockGetPhysicalAssetSummary,
}));

function mockListSuccess(
  items: Array<Record<string, unknown>>,
  options?: { total?: number; summary?: Record<string, number> },
) {
  mockGetPhysicalAssetSummary.mockResolvedValue(
    options?.summary ?? { total: items.length, available: 0, allocated: items.length, unavailable: 0 },
  );
  mockListPhysicalAssets.mockResolvedValue({
    items,
    limit: 20,
    offset: 0,
    total: options?.total ?? items.length,
  });
}

const allocatedItem = {
  id: 'asset-1',
  assetCode: 'TRK-001',
  resourceTypeId: 'truck',
  resourceTypeCode: 'TRUCK',
  resourceTypeClassification: 'VEHICLE',
  name: 'Caminhao pipa',
  lifecycleStatus: 'ACTIVE',
  allocationStatus: 'ALLOCATED',
  unitId: 'unit-a',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
  vehicle: { plate: 'ABC-1234', chassis: null, model: null },
  currentAllocation: {
    serviceOrderId: 'so-1',
    orderNumber: 'OS-2026-0001',
  },
};

describe('PhysicalAssetsListPage', () => {
  beforeEach(() => {
    mockListPhysicalAssets.mockReset();
    mockGetPhysicalAssetSummary.mockReset();
  });

  it('renders operational availability with service order and summary strip', async () => {
    mockListSuccess([allocatedItem], {
      summary: { total: 2, available: 1, allocated: 1, unavailable: 0 },
    });

    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'TRK-001' })).toBeInTheDocument();
    expect(screen.getByLabelText(/disponibilidade operacional: alocado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'OS-2026-0001' })).toHaveAttribute(
      'href',
      '/app/service-orders/so-1/planning',
    );
    expect(screen.getByRole('button', { name: 'Filtrar ativos disponíveis' })).toHaveTextContent(
      '1',
    );
    expect(screen.getByText('1–1 de 1 ativos')).toBeInTheDocument();
  });

  it('opens row actions menu with existing operations', async () => {
    const user = userEvent.setup();
    mockListSuccess([allocatedItem]);

    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: 'TRK-001' });
    await user.click(screen.getByRole('button', { name: 'Ações para TRK-001' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Visualizar detalhes' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', { name: 'Histórico/Alocações' }),
    ).toBeInTheDocument();
  });

  it('shows registered empty state when there are no assets', async () => {
    mockListSuccess([], { total: 0, summary: { total: 0, available: 0, allocated: 0, unavailable: 0 } });

    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Nenhum ativo cadastrado.')).toBeInTheDocument();
  });

  it('shows filtered empty state after applying availability filter', async () => {
    const user = userEvent.setup();
    mockGetPhysicalAssetSummary.mockResolvedValue({
      total: 1,
      available: 0,
      allocated: 1,
      unavailable: 0,
    });
    mockListPhysicalAssets
      .mockResolvedValueOnce({
        items: [allocatedItem],
        limit: 20,
        offset: 0,
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [],
        limit: 20,
        offset: 0,
        total: 0,
      });

    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: 'TRK-001' });
    await user.selectOptions(
      screen.getByLabelText('Disponibilidade'),
      ASSET_OPERATIONAL_AVAILABILITIES.Unavailable,
    );

    expect(
      await screen.findByText('Nenhum ativo encontrado para os filtros selecionados.'),
    ).toBeInTheDocument();
  });

  it('requests availability filter from backend when summary metric is selected', async () => {
    const user = userEvent.setup();
    mockListSuccess([allocatedItem]);

    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: 'TRK-001' });
    await user.click(screen.getByRole('button', { name: 'Filtrar ativos alocados' }));

    await vi.waitFor(() => {
      expect(mockListPhysicalAssets).toHaveBeenLastCalledWith(
        expect.objectContaining({
          availability: ASSET_OPERATIONAL_AVAILABILITIES.Allocated,
        }),
        expect.anything(),
      );
    });
  });

  it('shows unavailable operational detail for inactive assets', async () => {
    mockListSuccess([
      {
        ...allocatedItem,
        assetCode: 'TRK-INA',
        lifecycleStatus: 'INACTIVE',
        allocationStatus: 'AVAILABLE',
        currentAllocation: null,
      },
    ]);

    render(
      <MemoryRouter>
        <PhysicalAssetsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Cadastro inativo')).toBeInTheDocument();
    expect(screen.getByLabelText(/disponibilidade operacional: indispon/i)).toBeInTheDocument();
  });
});
