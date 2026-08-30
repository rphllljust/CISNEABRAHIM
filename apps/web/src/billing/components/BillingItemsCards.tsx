import type { BillingItem } from '../types/billing.types';
import { formatMoneyBrl, formatQuantity } from '../utils/billing-format';

type BillingItemsCardsProps = {
  items: BillingItem[];
  currencyCode: string;
};

export function BillingItemsCards({ items, currencyCode }: BillingItemsCardsProps) {
  return (
    <div className="billing-compare billing-compare--mobile">
      {items.map((item) => (
        <article key={item.id} className="billing-card">
          <header className="billing-card__header">
            <span className="billing-card__line">Linha {item.lineNumber}</span>
            <strong className="billing-card__amount">{formatMoneyBrl(item.lineAmount, currencyCode)}</strong>
          </header>
          <p className="billing-card__label">{item.lineLabel || `Item ${item.lineNumber}`}</p>
          <dl className="billing-card__grid">
            <div>
              <dt>Quantidade</dt>
              <dd>{formatQuantity(item.quantity, item.unitCode)}</dd>
            </div>
            <div>
              <dt>Preço unit.</dt>
              <dd>{formatMoneyBrl(item.unitPrice, currencyCode)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
