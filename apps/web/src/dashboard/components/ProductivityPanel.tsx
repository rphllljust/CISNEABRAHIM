import { useId } from 'react';
import { formatPercent, formatHours } from '../utils/dashboard-formatters';
import type { ProductivitySummary } from '../types/dashboard.types';

type ProductivityPanelProps = {
  productivity: ProductivitySummary;
};

export function ProductivityPanel({ productivity }: ProductivityPanelProps) {
  const headingId = useId();

  return (
    <section className="dashboard-section" aria-labelledby={headingId}>
      <header className="dashboard-section__header">
        <h2 id={headingId}>Produtividade</h2>
        <p className="dashboard-section__description">
          Métricas separadas — sem índice composto 0–100 até fórmula formal aprovada.
        </p>
      </header>
      <div className="dashboard-productivity" role="list">
        <Metric
          label="OS concluídas"
          value={String(productivity.completed)}
          detail="Volume no período"
        />
        <Metric
          label="Taxa no prazo"
          value={formatPercent(productivity.onTimeRate)}
          detail={`${productivity.onTimeRate.numerator} de ${productivity.onTimeRate.denominator} elegíveis`}
        />
        <Metric
          label="Cycle time médio"
          value={formatHours(productivity.averageCycleTime.valueHours)}
          detail={`Amostra: ${productivity.averageCycleTime.sampleSize}`}
        />
        <Metric
          label="Retrabalho"
          value={formatPercent(productivity.reworkRate)}
          detail={
            productivity.reworkRate.concept
              ? `${productivity.reworkRate.numerator} de ${productivity.reworkRate.denominator} medições`
              : 'Amostra insuficiente'
          }
        />
        <Metric
          label="Utilização"
          value={formatPercent(productivity.utilization)}
          detail={
            productivity.utilization.concept
              ? `${productivity.utilization.numerator} de ${productivity.utilization.denominator} segundos`
              : 'Amostra insuficiente'
          }
        />
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="dashboard-productivity__metric" role="listitem" aria-label={`${label}: ${value}`}>
      <p className="dashboard-productivity__label">{label}</p>
      <p className="dashboard-productivity__value">{value}</p>
      <p className="dashboard-productivity__detail">{detail}</p>
    </article>
  );
}
