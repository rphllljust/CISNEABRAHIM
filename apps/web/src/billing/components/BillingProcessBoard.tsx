import { BILLING_PROCESS_BUCKETS, type BillingWorkQueueItem } from '../types/billing.types';
import { groupWorkQueueByBucket } from '../utils/billing-process';
import { BillingProcessCard } from './BillingProcessCard';

type BillingProcessBoardProps = {
  items: BillingWorkQueueItem[];
};

const COLUMN_META = [
  {
    bucket: BILLING_PROCESS_BUCKETS.Ready,
    title: 'Pronto para faturar',
    description: 'Medição aprovada aguardando preparação.',
  },
  {
    bucket: BILLING_PROCESS_BUCKETS.Prepared,
    title: 'Em preparação',
    description: 'Preparação concluída e candidata a documento externo.',
  },
  {
    bucket: BILLING_PROCESS_BUCKETS.Divergence,
    title: 'Com divergência',
    description: 'Condições comerciais conflitantes exigem alinhamento.',
  },
] as const;

export function BillingProcessBoard({ items }: BillingProcessBoardProps) {
  const grouped = groupWorkQueueByBucket(items);

  return (
    <div className="billing-board">
      {COLUMN_META.map((column) => (
        <section
          key={column.bucket}
          className={`billing-board__column billing-board__column--${column.bucket}`}
          aria-labelledby={`billing-column-${column.bucket}`}
        >
          <header className="billing-board__header">
            <h2 id={`billing-column-${column.bucket}`}>{column.title}</h2>
            <p>{column.description}</p>
            <span className="billing-board__count" aria-label={`${grouped[column.bucket].length} itens`}>
              {grouped[column.bucket].length}
            </span>
          </header>
          <div className="billing-board__list">
            {grouped[column.bucket].length === 0 ? (
              <p className="billing-board__empty">Nenhum item nesta etapa.</p>
            ) : (
              grouped[column.bucket].map((item) => <BillingProcessCard key={item.serviceOrderId} item={item} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
