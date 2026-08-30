export function OperationalDashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-live="polite">
      <div className="dashboard-skeleton__kpi-row">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`kpi-${index}`} className="dashboard-skeleton__kpi" />
        ))}
      </div>
      <div className="dashboard-skeleton__card" />
      <div className="dashboard-skeleton__chart" />
    </div>
  );
}
