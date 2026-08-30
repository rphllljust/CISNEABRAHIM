import { useReportsCenter } from '../hooks/useReportsCenter';
import '../reports.css';

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );
  }
  return String(value);
}

export function ReportsPage() {
  const {
    state,
    selectedCatalogItem,
    setSelectedReportType,
    setFilters,
    generateExport,
    downloadExport,
    cancelExport,
    reload,
  } = useReportsCenter();

  if (state.phase === 'loading') {
    return (
      <main id="main-content" className="reports-page">
        <h1>Relatórios</h1>
        <p>Carregando catálogo de relatórios…</p>
      </main>
    );
  }

  if (state.phase === 'denied') {
    return (
      <main id="main-content" className="reports-page">
        <h1>Relatórios</h1>
        <p role="alert">Você não tem permissão para gerar relatórios.</p>
      </main>
    );
  }

  if (state.phase === 'error') {
    return (
      <main id="main-content" className="reports-page">
        <h1>Relatórios</h1>
        <div className="reports-status" role="alert">
          {state.message}
          <button type="button" onClick={() => void reload()} style={{ marginLeft: '0.75rem' }}>
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  const columns =
    state.preview?.contract.columns ??
    selectedCatalogItem?.columns ??
    [];
  const rows = state.preview?.preview ?? [];
  const rowKeys = rows[0] ? Object.keys(rows[0]) : [];
  const total = state.preview?.total ?? 0;
  const exportJob = state.exportJob;

  return (
    <main id="main-content" className="reports-page">
      <div className="reports-page__header">
        <h1>Relatórios</h1>
        <p className="reports-page__lead">
          Gere exportações auditáveis com filtros claros e pré-visualização limitada.
        </p>
      </div>

      <div className="reports-layout">
        <section className="reports-panel" aria-label="Seleção de relatório">
          <h2>Relatório</h2>
          <div className="reports-filters">
            <label htmlFor="report-type">
              Tipo
              <select
                id="report-type"
                value={state.selectedReportType}
                onChange={(event) => setSelectedReportType(event.target.value)}
              >
                {state.catalog.map((item) => (
                  <option key={item.reportType} value={item.reportType}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="report-period">
              Período
              <select
                id="report-period"
                value={state.filters.period ?? 'month'}
                onChange={(event) => setFilters({ period: event.target.value })}
              >
                <option value="week">Semana</option>
                <option value="month">Mês</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Ano</option>
              </select>
            </label>

            <label htmlFor="report-unit">
              Unidade (opcional)
              <input
                id="report-unit"
                type="text"
                value={state.filters.unitId ?? ''}
                onChange={(event) => setFilters({ unitId: event.target.value || undefined })}
              />
            </label>
          </div>

          {selectedCatalogItem?.sensitive ? (
            <p className="reports-sensitive" role="note">
              Exportação sensível — será registrada em auditoria.
            </p>
          ) : null}

          <div className="reports-actions">
            <button type="button" className="primary" onClick={() => void generateExport()} disabled={state.generating}>
              {state.generating ? 'Gerando…' : 'Gerar exportação'}
            </button>
            {exportJob?.downloadReady ? (
              <button type="button" onClick={() => void downloadExport()} disabled={state.downloadBusy}>
                {state.downloadBusy ? 'Baixando…' : 'Baixar CSV'}
              </button>
            ) : null}
            {exportJob && !exportJob.downloadReady && exportJob.status !== 'FAILED' && exportJob.status !== 'CANCELLED' ? (
              <button type="button" onClick={() => void cancelExport()}>
                Cancelar
              </button>
            ) : null}
          </div>
        </section>

        <section className="reports-panel" aria-label="Pré-visualização">
          <h2>Pré-visualização</h2>
          <div className="reports-preview-meta">
            <span>
              {state.previewLoading ? 'Atualizando prévia…' : `Mostrando até ${rows.length} de ${total} linhas`}
            </span>
            {state.preview?.contract.timezone ? (
              <span>Fuso: {state.preview.contract.timezone}</span>
            ) : null}
          </div>

          <div className="reports-table-wrap">
            <table className="reports-table">
              <caption className="visually-hidden">Pré-visualização do relatório selecionado</caption>
              <thead>
                <tr>
                  {rowKeys.map((key, columnIndex) => (
                    <th key={key} scope="col">
                      {columns[columnIndex] ?? key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)}>Nenhum dado para os filtros atuais.</td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={index}>
                      {rowKeys.map((key) => (
                        <td key={`${index}-${key}`}>{formatCell(row[key])}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {exportJob ? (
            <div
              className="reports-status"
              role={exportJob.status === 'FAILED' ? 'alert' : 'status'}
              aria-live="polite"
              style={{ marginTop: '0.75rem' }}
            >
              {exportJob.status === 'PENDING' || exportJob.status === 'RUNNING' ? (
                <div className="reports-progress">
                  <span aria-hidden="true">⏳</span>
                  <span>Gerando exportação em segundo plano…</span>
                </div>
              ) : null}
              {exportJob.status === 'COMPLETED' ? (
                <span>
                  Exportação concluída — {exportJob.rowCount ?? 0} linhas
                  {exportJob.fileSizeBytes ? ` (${Math.round(exportJob.fileSizeBytes / 1024)} KB)` : ''}.
                </span>
              ) : null}
              {exportJob.status === 'FAILED' ? (
                <span>Falha na exportação: {exportJob.errorMessage ?? 'erro desconhecido'}</span>
              ) : null}
              {exportJob.status === 'CANCELLED' ? <span>Exportação cancelada.</span> : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
