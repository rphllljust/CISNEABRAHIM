import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsPage } from './pages/ReportsPage';

const getReportCatalog = vi.fn();
const previewReport = vi.fn();
const createReportExport = vi.fn();
const getReportExport = vi.fn();
const downloadReportExport = vi.fn();
const cancelReportExport = vi.fn();

vi.mock('./api/reports-api', () => ({
  getReportCatalog: (...args: unknown[]) => getReportCatalog(...args),
  previewReport: (...args: unknown[]) => previewReport(...args),
  createReportExport: (...args: unknown[]) => createReportExport(...args),
  getReportExport: (...args: unknown[]) => getReportExport(...args),
  downloadReportExport: (...args: unknown[]) => downloadReportExport(...args),
  cancelReportExport: (...args: unknown[]) => cancelReportExport(...args),
  ReportsApiError: class ReportsApiError extends Error {
    kind = 'unknown';
  },
}));

const catalog = [
  {
    reportType: 'SERVICE_ORDERS_BY_PERIOD',
    label: 'OS por período',
    formats: ['CSV'],
    sensitive: false,
    columns: ['Número OS', 'Cliente', 'Status'],
  },
];

const preview = {
  contract: {
    name: 'OS por período',
    filters: { period: 'month' },
    columns: ['Número OS', 'Cliente', 'Status'],
    sort: { field: 'createdAt', direction: 'DESC' as const },
    timezone: 'America/Porto_Velho',
    generatedAt: null,
    actor: { identityId: 'id-1', sessionId: 's-1' },
    scope: { summary: 'scoped' },
  },
  preview: [{ orderNumber: 'SO-001', clientName: 'Alfa', status: 'PREPARED' }],
  total: 1,
};

describe('ReportsPage', () => {
  beforeEach(() => {
    getReportCatalog.mockReset();
    previewReport.mockReset();
    createReportExport.mockReset();
    getReportExport.mockReset();
    downloadReportExport.mockReset();
    cancelReportExport.mockReset();

    getReportCatalog.mockResolvedValue(catalog);
    previewReport.mockResolvedValue(preview);
  });

  it('renders catalog, preview table and accessible landmarks', async () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('SO-001')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: /relatórios/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByLabelText(/seleção de relatório/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pré-visualização/i)).toBeInTheDocument();
    expect(screen.getByText(/fuso: america\/porto_velho/i)).toBeInTheDocument();
  });

  it('generates export and exposes download action', async () => {
    const user = userEvent.setup();
    createReportExport.mockResolvedValue({
      id: 'export-1',
      reportType: 'SERVICE_ORDERS_BY_PERIOD',
      format: 'CSV',
      status: 'COMPLETED',
      contract: preview.contract,
      rowCount: 1,
      fileSizeBytes: 200,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      downloadReady: true,
    });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    await screen.findByText('SO-001');
    await user.click(screen.getByRole('button', { name: /gerar exportação/i }));

    await waitFor(() => {
      expect(createReportExport).toHaveBeenCalled();
    });
    expect(await screen.findByRole('button', { name: /baixar csv/i })).toBeInTheDocument();
    expect(screen.getByText(/exportação concluída/i)).toBeInTheDocument();
  });

  it('shows denied state when catalog is empty', async () => {
    getReportCatalog.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/não tem permissão/i);
  });
});
