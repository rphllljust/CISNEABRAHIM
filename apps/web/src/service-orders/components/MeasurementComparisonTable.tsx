import { formatMoneyBrl, formatQuantity } from '../utils/measurement-format';
import type { MeasurementComparisonRow } from '../utils/measurement-variance';
import { MeasurementVarianceBadge } from './MeasurementVarianceBadge';

type MeasurementComparisonTableProps = {
  rows: MeasurementComparisonRow[];
};

export function MeasurementComparisonTable({ rows }: MeasurementComparisonTableProps) {
  return (
    <div className="measurement-table-wrap">
      <table className="measurement-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Origem</th>
            <th scope="col" className="measurement-table__num">
              Planejado
            </th>
            <th scope="col" className="measurement-table__num">
              Realizado
            </th>
            <th scope="col" className="measurement-table__num">
              Medido
            </th>
            <th scope="col" className="measurement-table__num">
              Valor
            </th>
            <th scope="col">Conferência</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={`measurement-table__row measurement-table__row--${row.primaryVariance.replace(/_/g, '-')}`}
            >
              <th scope="row">
                {row.label}
                <span className="measurement-table__unit">{row.unitCode}</span>
              </th>
              <td>
                <code className="measurement-origin" title={row.sourceExecutionEntryId ?? undefined}>
                  {row.sourceExecutionEntryId ? row.sourceExecutionEntryId.slice(0, 8) : '—'}
                </code>
              </td>
              <td className="measurement-amount measurement-table__num">
                {row.plannedQuantity ? formatQuantity(row.plannedQuantity, row.unitCode) : '—'}
              </td>
              <td className="measurement-amount measurement-table__num">
                {row.actualQuantity ? formatQuantity(row.actualQuantity, row.unitCode) : '—'}
              </td>
              <td className="measurement-amount measurement-amount--emphasis measurement-table__num">
                {row.measuredQuantity ? formatQuantity(row.measuredQuantity, row.unitCode) : '—'}
              </td>
              <td className="measurement-amount measurement-table__num">{formatMoneyBrl(row.lineAmount)}</td>
              <td>
                <div className="measurement-variance-list">
                  {row.variances.map((variance) => (
                    <MeasurementVarianceBadge key={`${row.key}-${variance}`} variance={variance} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
