export function OperationalDashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-live="polite">
      <div className="dashboard-skeleton__header" />
      <div className="dashboard-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-skeleton__card" />
        ))}
      </div>
    </div>
  );
}
