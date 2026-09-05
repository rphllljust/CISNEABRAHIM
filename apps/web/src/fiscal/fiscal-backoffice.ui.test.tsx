import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import { createFinanceFetchMock, MOCK_FISCAL_ID } from '../test/finance-fetch-mock';
import { renderWithProviders } from '../test/render-with-providers';
import { FiscalDocumentsPage } from './pages/FiscalDocumentsPage';

describe('Fiscal backoffice UI', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('starts empty and loads a fiscal document from the backend', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createFinanceFetchMock());
    renderWithProviders(
      <Routes>
        <Route path="/app/fiscal/documents" element={<FiscalDocumentsPage />} />
        <Route path="/app/fiscal/documents/:fiscalDocumentId" element={<FiscalDocumentsPage />} />
      </Routes>,
      { router: { initialEntries: ['/app/fiscal/documents'] } },
    );
    expect(screen.getByText(/nenhum documento carregado/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/identificador do documento/i), MOCK_FISCAL_ID);
    await user.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /itens do documento fiscal/i })).toBeInTheDocument();
    });
  });

  it('renders persisted tax amounts without recalculating', async () => {
    vi.stubGlobal('fetch', createFinanceFetchMock());
    renderWithProviders(
      <Routes>
        <Route path="/app/fiscal/documents/:fiscalDocumentId" element={<FiscalDocumentsPage />} />
      </Routes>,
      { router: { initialEntries: [`/app/fiscal/documents/${MOCK_FISCAL_ID}`] } },
    );
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /itens do documento fiscal/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/100,00/)).toBeInTheDocument();
    expect(screen.getByText(/5,00/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /tributos persistidos/i })).toBeInTheDocument();
    expect(screen.getByText('SEM VALIDADE FISCAL')).toBeInTheDocument();
    expect(screen.getByText('Bloqueada')).toBeInTheDocument();
  });

  it('shows denied when fiscal read is forbidden', async () => {
    vi.stubGlobal('fetch', createFinanceFetchMock({ fiscalAllowed: false }));
    renderWithProviders(
      <Routes>
        <Route path="/app/fiscal/documents/:fiscalDocumentId" element={<FiscalDocumentsPage />} />
      </Routes>,
      { router: { initialEntries: [`/app/fiscal/documents/${MOCK_FISCAL_ID}`] } },
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão/i);
    });
  });
});
