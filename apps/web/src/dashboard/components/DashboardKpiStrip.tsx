import { Link } from 'react-router-dom';
import { cn } from '../../ui/utils/cn';
import type { DashboardKpi } from '../utils/build-dashboard-kpis';

type DashboardKpiStripProps = {
  kpis: DashboardKpi[];
};

function isHighlightedKpi(kpi: DashboardKpi, index: number, total: number) {
  return kpi.id === 'on-time-rate' || (kpi.id !== 'active-service-orders' && index === total - 1 && total > 1);
}

function KpiCell({
  kpi,
  highlighted,
}: {
  kpi: DashboardKpi;
  highlighted: boolean;
}) {
  const content = (
    <>
      <p className={cn('text-sm font-medium', highlighted ? 'text-brand-800' : 'text-gray-500')}>
        {kpi.label}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-3xl font-semibold tracking-tight tabular-nums',
            highlighted ? 'text-brand-700' : 'text-gray-900',
          )}
          aria-hidden="true"
        >
          {kpi.value}
        </span>
        {kpi.unit ? (
          <span className={cn('text-sm', highlighted ? 'text-brand-700/70' : 'text-gray-500')}>
            {kpi.unit}
          </span>
        ) : null}
      </p>
      {kpi.context ? (
        <p className={cn('mt-2 text-xs', highlighted ? 'text-brand-700/60' : 'text-gray-400')}>
          {kpi.context}
        </p>
      ) : null}
    </>
  );

  const cellClass = cn('px-6 py-6', highlighted && 'bg-brand-50/60');

  if (kpi.href) {
    return (
      <Link className={cn(cellClass, 'block text-inherit no-underline hover:bg-gray-50/80')} to={kpi.href} aria-label={kpi.ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <article className={cellClass} aria-label={kpi.ariaLabel}>
      {content}
    </article>
  );
}

export function DashboardKpiStrip({ kpis }: DashboardKpiStripProps) {
  if (kpis.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="kpi-heading">
      <header className="mb-4">
        <h2 id="kpi-heading" className="text-base font-semibold text-gray-900">
          Indicadores principais
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">Resumo dos resultados no período selecionado.</p>
      </header>

      <div
        className="mb-12 grid grid-cols-1 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 sm:grid-cols-2 sm:divide-x sm:divide-gray-200 lg:grid-cols-4"
        role="list"
      >
        {kpis.map((kpi, index) => (
          <div key={kpi.id} role="listitem">
            <KpiCell
              kpi={kpi}
              highlighted={isHighlightedKpi(kpi, index, kpis.length)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
