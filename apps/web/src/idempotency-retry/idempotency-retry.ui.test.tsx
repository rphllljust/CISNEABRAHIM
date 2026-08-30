import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import { renderBillingRoutes } from '../test/render-billing-routes';
import {
  createServiceOrdersFetchMock,
  MOCK_SERVICE_ORDER_ID,
} from '../test/service-orders-fetch-mock';
import { Button } from '../ui/Button';

function SubmitFormFixture() {
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setCount((value) => value + 1);
    window.setTimeout(() => setSubmitting(false), 200);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={submitting} aria-busy={submitting}>
        Confirmar
      </button>
      <p data-testid="submit-count">{count}</p>
    </form>
  );
}

describe('Idempotency & double-submit UI guards', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('blocks double click on loading primary action', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <Button
        type="button"
        loading
        onClick={() => {
          onSubmit();
        }}
      >
        Enviar
      </Button>,
    );

    const button = screen.getByRole('button', { name: /carregando: enviar/i });
    await user.click(button);
    await user.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks repeated Enter during submit', async () => {
    const user = userEvent.setup();
    render(<SubmitFormFixture />);

    const submit = screen.getByRole('button', { name: /confirmar/i });
    submit.focus();
    await user.keyboard('{Enter}{Enter}{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('submit-count')).toHaveTextContent('1');
    });
  });

  it('blocks rapid mobile taps during execution start', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.stubGlobal('fetch', createServiceOrdersFetchMock({ executionDelayedStartMs: 400 }));
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/execution`);
    render(<App />);

    const startButton = await screen.findByRole('button', { name: /confirmar e começar/i });
    await user.click(startButton);
    await user.click(startButton);
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/execução iniciada/i)).toBeInTheDocument();
    });

    const startCalls = vi.mocked(fetch).mock.calls.filter((call) => {
      const request = call[0];
      const url = typeof request === 'string' ? request : request instanceof Request ? request.url : '';
      return url.includes('/execution/start');
    });
    expect(startCalls.length).toBe(1);
  }, 30_000);

  it('blocks double finalize on billing document dialog', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const fetchMock = createServiceOrdersFetchMock({
      orderCompleted: true,
      seedMeasurement: 'approved',
      seedBilling: 'prepared',
      billingDocumentDelayedIssueMs: 400,
    });
    vi.stubGlobal('fetch', fetchMock);

    renderBillingRoutes(`/app/service-orders/${MOCK_SERVICE_ORDER_ID}/billing/document`);

    await user.click(await screen.findByRole('button', { name: /emitir nota fatura/i }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: /emitir nota fatura/i });
    await user.click(confirm);
    await user.click(confirm);

    const issueCalls = fetchMock.mock.calls.filter((call) => {
      const request = call[0];
      const init = call[1];
      const url = typeof request === 'string' ? request : request instanceof Request ? request.url : '';
      return /\/billing-records\/[^/]+\/documents$/.test(url) && init?.method === 'POST';
    });

    await waitFor(() => {
      expect(screen.getByText(/emitida com sucesso/i)).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /baixar pdf/i })).toHaveLength(1);
    expect(issueCalls.length).toBeLessThanOrEqual(2);
  }, 30_000);
});
