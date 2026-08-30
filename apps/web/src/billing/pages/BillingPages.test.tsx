import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from '../../auth/storage/token-store';
import { renderBillingRoutes } from '../../test/render-billing-routes';
import {
  createServiceOrdersFetchMock,
  MOCK_SERVICE_ORDER_ID,
} from '../../test/service-orders-fetch-mock';

const billingPath = `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/billing`;
const dashboardPath = '/app/billing';

describe('BillingDashboardPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('lists work queue buckets', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
      }),
    );
    renderBillingRoutes(dashboardPath);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /pronto para faturar/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /em preparação/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /com divergência/i })).toBeInTheDocument();
    expect(screen.getByText(/OS-2026-DEMO01/)).toBeInTheDocument();
  });

  it('shows forbidden state when billing read is denied', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        billingReadAllowed: false,
      }),
    );
    renderBillingRoutes(dashboardPath);

    await waitFor(() => {
      expect(screen.getByText(/não tem permissão/i)).toBeInTheDocument();
    });
  });
});

describe('ServiceOrderBillingPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('renders billing detail with financial table', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
      }),
    );
    renderBillingRoutes(billingPath);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /OS-2026-DEMO01/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText(/R\$\s*1\.000,00/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /itens faturáveis/i })).toBeInTheDocument();
  });

  it('shows commercial terms mismatch prominently', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        purchaseOrderPaymentTerms: '07 DDL',
      }),
    );
    renderBillingRoutes(billingPath);

    await waitFor(() => {
      expect(screen.getByLabelText(/condição comercial para preparação/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/condição comercial para preparação/i);
    await user.clear(input);
    await user.type(input, 'À vista');

    await waitFor(() => {
      expect(screen.getByRole('alert', { name: /divergência de condições comerciais/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /fonte a/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/07 DDL/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adotar condição da fonte autoritativa/i })).toBeInTheDocument();
  });

  it('blocks prepare when terms diverge and allows after adopting authoritative terms', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        purchaseOrderPaymentTerms: '07 DDL',
      }),
    );
    renderBillingRoutes(billingPath);

    const input = await screen.findByLabelText(/condição comercial para preparação/i);
    await user.clear(input);
    await user.type(input, 'À vista');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preparar faturamento/i })).toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /adotar condição da fonte autoritativa/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /preparar faturamento/i })).toBeEnabled();
    });
  });

  it('shows version conflict banner on stale void', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
        billingVersionConflict: true,
      }),
    );
    renderBillingRoutes(billingPath);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /anular preparação/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /anular preparação/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /confirmar anulação/i }));

    await waitFor(() => {
      expect(screen.getByText(/registro desatualizado/i)).toBeInTheDocument();
    });
  });

  it('uses responsive item layouts', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
      }),
    );
    renderBillingRoutes(billingPath);

    await waitFor(() => {
      expect(document.querySelector('.billing-compare--desktop')).toBeTruthy();
      expect(document.querySelector('.billing-compare--mobile')).toBeTruthy();
    });
  });

  it('exposes accessible financial summary labels', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
      }),
    );
    renderBillingRoutes(billingPath);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resumo financeiro/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/^total$/i)).toBeInTheDocument();
    expect(screen.getByText(/condição comercial/i)).toBeInTheDocument();
  });
});
