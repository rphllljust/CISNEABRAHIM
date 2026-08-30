type DashboardFiltersProps = {
  period: string;
  periodOptions: ReadonlyArray<{ value: string; label: string }>;
  onPeriodChange: (period: string) => void;
  periodLabel: string;
};

export function DashboardFilters({
  period,
  periodOptions,
  onPeriodChange,
  periodLabel,
}: DashboardFiltersProps) {
  return (
    <section className="dashboard-filters" aria-label="Filtros do painel">
      <p className="dashboard-filters__context">
        Período analisado: <strong>{periodLabel}</strong>
      </p>
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
      </div>
    </section>
  );
}
