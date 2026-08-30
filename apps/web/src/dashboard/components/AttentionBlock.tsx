import { Link } from 'react-router-dom';
import type { ExecutiveAttentionItem } from '../types/dashboard.types';

type AttentionBlockProps = {
  items: ExecutiveAttentionItem[];
};

const SEVERITY_CLASS: Record<ExecutiveAttentionItem['severity'], string> = {
  critical: 'dashboard-attention__card--critical',
  warning: 'dashboard-attention__card--warning',
  info: 'dashboard-attention__card--info',
};

export function AttentionBlock({ items }: AttentionBlockProps) {
  return (
    <section className="dashboard-section" aria-labelledby="attention-heading">
      <header className="dashboard-section__header">
        <h2 id="attention-heading">Atenção necessária</h2>
        <p className="dashboard-section__description">
          Pendências que exigem decisão imediata antes da análise detalhada.
        </p>
      </header>
      {items.length > 0 ? (
        <div className="dashboard-attention" role="list">
          {items.map((item) => {
            const className = `dashboard-attention__card ${SEVERITY_CLASS[item.severity]}${
              item.id === 'overdue-service-orders' ? ' dashboard-attention__card--overdue' : ''
            }`;
            const content = (
              <>
                <p className="dashboard-attention__label">{item.label}</p>
                <p
                  className={`dashboard-attention__count dashboard-attention__count--${item.severity}`}
                  aria-hidden="true"
                >
                  {item.count}
                </p>
                {item.detail ? <p className="dashboard-attention__detail">{item.detail}</p> : null}
                {item.maxDelayDays !== null && item.id === 'overdue-service-orders' ? (
                  <p className="dashboard-attention__badge" aria-hidden="true">
                    Prioridade máxima
                  </p>
                ) : null}
                <p className="dashboard-attention__action">Ver lista filtrada</p>
              </>
            );

            if (item.href) {
              return (
                <div key={item.id} role="listitem">
                  <Link className={className} to={item.href} aria-label={item.ariaLabel}>
                    {content}
                  </Link>
                </div>
              );
            }

            return (
              <article key={item.id} className={className} aria-label={item.ariaLabel} role="listitem">
                {content}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="dashboard-section__empty">Nenhuma pendência crítica no momento.</p>
      )}
    </section>
  );
}
