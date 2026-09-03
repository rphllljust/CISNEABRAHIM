import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import { createFinanceFetchMock, MOCK_JOURNAL_ID, MOCK_PERIOD_ID } from '../test/finance-fetch-mock';
import { renderWithProviders } from '../test/render-with-providers';
import { JournalsPage } from './pages/JournalsPage';
import { IncomeStatementPage, BalanceSheetPage } from './pages/PeriodReportPages';
import { PeriodClosePage } from './pages/PeriodClosePage';

describe('Accounting backoffice UI', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('shows journal totals returned by the server', async () => {
    vi.stubGlobal('fetch', createFinanceFetchMock());
    renderWithProviders(
      <Routes>
        <Route path="/app/accounting/journals/:journalId" element={<JournalsPage />} />
      </Routes>,
      { router: { initialEntries: [`/app/accounting/journals/${MOCK_JOURNAL_ID}`] } },
    );
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /linhas do lançamento/i })).toBeInTheDocument();
    });
    expect(screen.getAllByText(/50,00/).length).toBeGreaterThan(0);
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('does not mark a journal posted when the period is closed', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createFinanceFetchMock({ closedPeriod: true }));
    renderWithProviders(
      <Routes>
        <Route path="/app/accounting/journals/:journalId" element={<JournalsPage />} />
      </Routes>,
      { router: { initialEntries: [`/app/accounting/journals/${MOCK_JOURNAL_ID}`] } },
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Postar' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Postar' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Postar' }));
    await waitFor(() => {
      expect(screen.getByText(/período está fechado/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Lançado')).not.toBeInTheDocument();
  });

  it('shows closed period after a successful close response', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createFinanceFetchMock());
    renderWithProviders(<PeriodClosePage />);
    await user.type(screen.getByLabelText(/identificador do período/i), MOCK_PERIOD_ID);
    const reasonField = screen.getAllByLabelText(/justificativa/i)[0];
    expect(reasonField).toBeTruthy();
    await user.type(reasonField as HTMLElement, 'Fechamento mensal');
    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => {
      expect(screen.getByText(/período fechado/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/status: fechado/i)).toBeInTheDocument();
  });

  it('shows DRE totals returned by the server', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createFinanceFetchMock());
    renderWithProviders(<IncomeStatementPage />);
    await user.type(screen.getByLabelText(/identificador do período/i), MOCK_PERIOD_ID);
    await user.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /demonstração do resultado/i })).toBeInTheDocument();
    });
    expect(screen.getByText('POSTED_JOURNAL_ENTRY')).toBeInTheDocument();
    expect(screen.getAllByText(/70,00/).length).toBeGreaterThan(0);
  });

  it('surfaces incomplete classification instead of inventing a DRE', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createFinanceFetchMock({ classificationIncomplete: true }));
    renderWithProviders(<IncomeStatementPage />);
    await user.type(screen.getByLabelText(/identificador do período/i), MOCK_PERIOD_ID);
    await user.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/classificação contábil está incompleta/i);
    });
    expect(screen.queryByRole('table', { name: /demonstração do resultado/i })).not.toBeInTheDocument();
  });

  it('shows balance sheet totals returned by the server', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', createFinanceFetchMock());
    renderWithProviders(<BalanceSheetPage />);
    await user.type(screen.getByLabelText(/identificador do período/i), MOCK_PERIOD_ID);
    await user.click(screen.getByRole('button', { name: 'Consultar' }));
    await waitFor(() => {
      expect(screen.getByRole('table', { name: /balanço patrimonial/i })).toBeInTheDocument();
    });
    expect(screen.getByText('POSTED_JOURNAL_ENTRY')).toBeInTheDocument();
    expect(screen.getAllByText(/70,00/).length).toBeGreaterThan(0);
  });

  it('shows access denied for journal read', async () => {
    vi.stubGlobal('fetch', createFinanceFetchMock({ accountingAllowed: false }));
    renderWithProviders(
      <Routes>
        <Route path="/app/accounting/journals/:journalId" element={<JournalsPage />} />
      </Routes>,
      { router: { initialEntries: [`/app/accounting/journals/${MOCK_JOURNAL_ID}`] } },
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão/i);
    });
  });
});
