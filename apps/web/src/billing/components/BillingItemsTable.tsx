import type { BillingItem } from '../types/billing.types';
import { formatMoneyBrl, formatQuantity } from '../utils/billing-format';

type BillingItemsTableProps = {
  items: BillingItem[];
  currencyCode: string;
};

export function BillingItemsTable({ items, currencyCode }: BillingItemsTableProps) {
  return (
    <div className="billing-compare billing-compare--desktop">
      <table className="billing-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Descrição</th>
            <th scope="col" className="billing-table__num">
              Quantidade
            </th>
            <th scope="col" className="billing-table__num">
              Preço unit.
            </th>
            <th scope="col" className="billing-table__num">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="billing-table__num">{item.lineNumber}</td>
              <td>{item.lineLabel || `Item ${item.lineNumber}`}</td>
              <td className="billing-table__num">{formatQuantity(item.quantity, item.unitCode)}</td>
              <td className="billing-table__num">{formatMoneyBrl(item.unitPrice, currencyCode)}</td>
              <td className="billing-table__num billing-table__amount">
                {formatMoneyBrl(item.lineAmount, currencyCode)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
