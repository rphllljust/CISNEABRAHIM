import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestsFetchMock } from '../../test/requests-fetch-mock';
import { renderRequestRoutes } from '../../test/render-request-routes';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

const REQUEST_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('ServiceRequestDetailPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('separates origin from registered-by sections', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock());
    renderRequestRoutes(`/app/requests/${REQUEST_ID}`);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /origem da solicitação/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /registrado por/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /converter/i })).not.toBeInTheDocument();
  });

  it('submits, reviews, approves and cancels workflow', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock());
    const user = userEvent.setup();
    renderRequestRoutes(`/app/requests/${REQUEST_ID}`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^enviar$/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^enviar$/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Status: Enviada')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /iniciar análise/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Status: Em análise')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^aprovar$/i }));
    await user.click(screen.getByRole('button', { name: /confirmar aprovação/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Status: Aprovada')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));
    await user.type(screen.getByLabelText(/motivo do cancelamento/i), 'Cliente desistiu');
    await user.click(screen.getByRole('button', { name: /confirmar cancelamento/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Status: Cancelada')).toBeInTheDocument();
    });
  });

  it('rejects with reason', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock());
    const user = userEvent.setup();
    renderRequestRoutes(`/app/requests/${REQUEST_ID}`);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^enviar$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));
    await user.click(screen.getByRole('button', { name: /iniciar análise/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^rejeitar$/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^rejeitar$/i }));
    await user.type(screen.getByLabelText(/motivo da rejeição/i), 'Fora do escopo');
    await user.click(screen.getByRole('button', { name: /confirmar rejeição/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Status: Rejeitada')).toBeInTheDocument();
      expect(screen.getByText('Fora do escopo')).toBeInTheDocument();
    });
  });
});
