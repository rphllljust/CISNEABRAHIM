import { CoverageStatusBadge } from './CoverageStatusBadge';
import type { RequirementCoverageRow } from '../utils/planning-aggregates';

type RequirementCoverageTableProps = {
  rows: RequirementCoverageRow[];
};

export function RequirementCoverageTable({ rows }: RequirementCoverageTableProps) {
  if (rows.length === 0) {
    return (
      <p className="planning-empty" role="status">
        Nenhum requisito de recurso ou mão de obra definido no snapshot do serviço.
      </p>
    );
  }

  return (
    <div className="planning-table-wrap">
      <table className="planning-table" aria-describedby="planning-coverage-caption">
        <caption id="planning-coverage-caption" className="planning-sr-only">
          Cobertura de requisitos: necessário, planejado, alocado e pendente
        </caption>
        <thead>
          <tr>
            <th scope="col">Tipo</th>
            <th scope="col">Código</th>
            <th scope="col">Necessário</th>
            <th scope="col">Planejado</th>
            <th scope="col">Alocado</th>
            <th scope="col">Pendente</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.kind === 'PHYSICAL_RESOURCE' ? 'Recurso físico' : 'Mão de obra'}</td>
              <td>
                <strong>{row.label}</strong>
              </td>
              <td>{row.required}</td>
              <td>{row.planned}</td>
              <td>{row.kind === 'LABOR' ? '—' : row.allocated}</td>
              <td>{row.pending}</td>
              <td>
                <CoverageStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
