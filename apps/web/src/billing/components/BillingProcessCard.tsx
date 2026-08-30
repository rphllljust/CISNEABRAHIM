import { Link } from 'react-router-dom';
import type { BillingWorkQueueItem } from '../types/billing.types';
import { formatMoneyBrl } from '../utils/billing-format';

type BillingProcessCardProps = {
  item: BillingWorkQueueItem;
};

export function BillingProcessCard({ item }: BillingProcessCardProps) {
  return (
    <article className="billing-process-card">
      <header className="billing-process-card__header">
        <h3>
          <Link to={`/app/service-orders/${item.serviceOrderId}/billing`}>{item.orderNumber}</Link>
        </h3>
        <p className="billing-process-card__client">{item.clientLabel}</p>
      </header>
      <p className="billing-process-card__amount">{formatMoneyBrl(item.totalAmount)}</p>
      {item.termsDivergence ? (
        <p className="billing-process-card__flag" role="status">
          Divergência de condições
        </p>
      ) : null}
    </article>
  );
}
