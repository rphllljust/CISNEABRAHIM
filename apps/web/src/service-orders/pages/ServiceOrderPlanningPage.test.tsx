import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from '../../auth/storage/token-store';
import { renderServiceOrderRoutes } from '../../test/render-service-order-routes';
import {
  createServiceOrdersFetchMock,
  MOCK_ASSET_A_ID,
  MOCK_ASSET_B_ID,
  MOCK_SERVICE_ORDER_ID,
} from '../../test/service-orders-fetch-mock';
import { requestUrl } from '../../test/request-url';

function fillAllocationWindow(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText(/início operacional/i), {
    target: { value: '2026-08-29T08:00' },
  });
  fireEvent.change(within(dialog).getByLabelText(/fim operacional/i), {
    target: { value: '2026-08-29T10:00' },
  });
}

describe('ServiceOrderPlanningPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('renders requirement coverage and operational summary', async () => {
    vi.stubGlobal('fetch', createServiceOrdersFetchMock());
    renderServiceOrderRoutes(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /OS-2026-DEMO01/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /requisitos do serviço/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'TRUCK' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'OPERATOR' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Status: Pendente').length).toBeGreaterThan(0);
  });

  it('plans a physical resource and allocates with backend confirmation', async () => {
    vi.stubGlobal('fetch', createServiceOrdersFetchMock());
    const user = userEvent.setup();
    renderServiceOrderRoutes(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /planejar 1× TRUCK/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /planejar 1× TRUCK/i }));

    await waitFor(() => {
      expect(screen.getByText(/recurso planejado com sucesso/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /alocar ativo/i }));

    const dialog = await screen.findByRole('dialog');
    fillAllocationWindow(dialog);
    await user.click(within(dialog).getByLabelText(/caminhão demo/i));
    await user.click(within(dialog).getByRole('button', { name: /confirmar alocação/i }));

    await waitFor(() => {
      expect(screen.getByText(/alocação confirmada pelo servidor/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /alocações confirmadas/i })).toBeInTheDocument();
  });

  it('surfaces allocation conflict without closing the dialog and allows substitute asset', async () => {
    vi.stubGlobal('fetch', createServiceOrdersFetchMock());
    const user = userEvent.setup();
    renderServiceOrderRoutes(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /planejar 1× TRUCK/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /planejar 1× TRUCK/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /alocar ativo/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /alocar ativo/i }));

    const dialog = await screen.findByRole('dialog');
    fillAllocationWindow(dialog);
    await user.click(within(dialog).getByLabelText(/caminhão demo/i));
    await user.click(within(dialog).getByRole('button', { name: /confirmar alocação/i }));

    await waitFor(() => {
      expect(screen.getByText(/alocação confirmada pelo servidor/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /alocar ativo/i }));
    const retryDialog = await screen.findByRole('dialog');
    fillAllocationWindow(retryDialog);
    await user.click(within(retryDialog).getByLabelText(/caminhão demo/i));
    await user.click(within(retryDialog).getByRole('button', { name: /confirmar alocação/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/não está disponível no intervalo solicitado/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/indisponível \(conflito\)/i)).toBeInTheDocument();

    await user.click(within(retryDialog).getByLabelText(/caminhão reserva/i));
    await user.click(within(retryDialog).getByRole('button', { name: /confirmar alocação/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/alocação confirmada pelo servidor/i).length).toBeGreaterThan(0);
    });
    expect(MOCK_ASSET_A_ID).toBeTruthy();
    expect(MOCK_ASSET_B_ID).toBeTruthy();
  });

  it('shows forbidden state when read access is denied', async () => {
    vi.stubGlobal('fetch', createServiceOrdersFetchMock({ serviceOrderReadAllowed: false }));
    renderServiceOrderRoutes(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`);

    await waitFor(() => {
      expect(screen.getByText(/não tem permissão/i)).toBeInTheDocument();
    });
  });

  it('blocks duplicate submit while allocation is in flight', async () => {
    let resolveAllocate: (value: Response) => void = () => undefined;
    const fetchMock = createServiceOrdersFetchMock();
    const wrapped = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = requestUrl(input);
      const isTargetAllocate =
        init?.method === 'POST' &&
        url.includes(`/api/v1/service-orders/${MOCK_SERVICE_ORDER_ID}/allocations`);
      if (isTargetAllocate) {
        return new Promise<Response>((resolve) => {
          resolveAllocate = resolve;
        });
      }
      return fetchMock(input, init);
    });
    vi.stubGlobal('fetch', wrapped);

    const user = userEvent.setup();
    renderServiceOrderRoutes(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /planejar 1× TRUCK/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /planejar 1× TRUCK/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /alocar ativo/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /alocar ativo/i }));

    const dialog = await screen.findByRole('dialog');
    fillAllocationWindow(dialog);
    await user.click(within(dialog).getByLabelText(/caminhão demo/i));

    const confirmButton = within(dialog).getByRole('button', { name: /confirmar alocação/i });
    await user.click(confirmButton);
    expect(confirmButton).toBeDisabled();

    resolveAllocate({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'alloc-1',
        serviceOrderId: MOCK_SERVICE_ORDER_ID,
        plannedResourceId: 'planned-1',
        physicalAssetId: MOCK_ASSET_A_ID,
        resourceTypeCode: 'TRUCK',
        operationalStart: '2026-08-29T08:00:00.000Z',
        operationalEnd: '2026-08-29T10:00:00.000Z',
        status: 'ACTIVE',
        rowVersion: 1,
        allocatedAt: new Date().toISOString(),
        removedAt: null,
        historyEvents: [],
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText(/alocação confirmada pelo servidor/i)).toBeInTheDocument();
    });
    expect(
      wrapped.mock.calls.filter(
        (call) =>
          call[1]?.method === 'POST' &&
          requestUrl(call[0]).includes(`/api/v1/service-orders/${MOCK_SERVICE_ORDER_ID}/allocations`),
      ).length,
    ).toBe(1);
  });
});
