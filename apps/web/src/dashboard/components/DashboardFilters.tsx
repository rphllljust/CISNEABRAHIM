type DashboardFiltersProps = {
  period: string;
  periodOptions: ReadonlyArray<{ value: string; label: string }>;
  onPeriodChange: (period: string) => void;
  periodLabel: string;
  activeFilters: string[];
  onClearFilters?: () => void;
};

export function DashboardFilters({
  period,
  periodOptions,
  onPeriodChange,
  periodLabel,
  activeFilters,
  onClearFilters,
}: DashboardFiltersProps) {
  const hasExtraFilters = activeFilters.length > 0;

  return (
    <section className="dashboard-filters" aria-label="Filtros do painel">
      <div className="dashboard-filters__summary">
        <p className="dashboard-filters__context">
          Período analisado: <strong>{periodLabel}</strong>
        </p>
        {hasExtraFilters ? (
          <ul className="dashboard-filters__active" aria-label="Filtros ativos">
            {activeFilters.map((filter) => (
              <li key={filter}>
                <span className="dashboard-filters__chip">{filter}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="dashboard-filters__controls">
        <label className="dashboard-filters__field" htmlFor="dashboard-period">
          Período
        </label>
        <select
          id="dashboard-period"
          className="dashboard-filters__select"
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasExtraFilters && onClearFilters ? (
          <button type="button" className="dashboard-filters__clear" onClick={onClearFilters}>
            Limpar filtros
          </button>
        ) : null}
      </div>
    </section>
  );
}
