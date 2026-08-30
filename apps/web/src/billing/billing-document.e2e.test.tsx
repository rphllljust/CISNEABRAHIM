import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import {
  createServiceOrdersFetchMock,
  MOCK_SERVICE_ORDER_ID,
} from '../test/service-orders-fetch-mock';

describe('billing document workflow e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('navigates from billing detail to document workflow and issues Nota Fatura', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
      }),
    );
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/billing`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /emitir nota fatura/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /emitir nota fatura/i }));

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/billing/document`);
      expect(screen.getByRole('heading', { name: /pré-visualização/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /emitir nota fatura/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /emitir nota fatura/i }));

    await waitFor(() => {
      expect(screen.getByText(/emitida com sucesso/i)).toBeInTheDocument();
    });
  });

  it('blocks issuance when terms mismatch is present on document workflow', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'approved',
        seedBilling: 'prepared',
        purchaseOrderPaymentTerms: '07 DDL',
        preparedPaymentTerms: 'À vista',
      }),
    );
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/billing/document`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert', { name: /divergência de condições comerciais/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /emitir nota fatura/i })).not.toBeInTheDocument();
  });
});
