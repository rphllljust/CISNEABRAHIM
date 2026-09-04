import { AccessAdminApiError, getCatalog, type AccessAdminCatalog } from '../api/access-admin-api';
import { mapAccessAdminErrorToMessage } from '../api/access-admin-error-messages';
import { useAsyncResource } from '../hooks/useAccessAdminData';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui';

export function ScopesTab() {
  const { state, refresh } = useAsyncResource<AccessAdminCatalog>(() => getCatalog());

  if (state.phase === 'loading') {
    return <LoadingState label="Carregando catálogo de escopos…" />;
  }

  if (state.phase === 'error') {
    const message =
      state.error instanceof AccessAdminApiError
        ? mapAccessAdminErrorToMessage(state.error.code, state.error.status)
        : 'Não foi possível carregar o catálogo de escopos.';
    return <ErrorState title="Escopos" message={message} onRetry={refresh} />;
  }

  const scopes = state.data.scopes;

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-gray-500">
        Catálogo de escopos do servidor. O cliente não define escopos novos: apenas
        utiliza os códigos retornados aqui.
      </p>

      {scopes.length === 0 ? (
        <EmptyState
          title="Nenhum escopo"
          description="O catálogo de escopos retornado pelo servidor está vazio."
        />
      ) : (
        <ModuleTableCard>
          <table className={moduleTableClass} aria-label="Catálogo de escopos">
            <thead className={moduleTableHeadClass}>
              <tr>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Código
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Ancorado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scopes.map((scope) => (
                <tr key={scope.code} className={moduleTableRowClass}>
                  <td className={moduleTableCellClass}>
                    <span className="font-mono text-gray-600">{scope.code}</span>
                  </td>
                  <td className={moduleTableCellClass}>
                    {scope.anchored ? (
                      <Badge tone="warning">Ancorado</Badge>
                    ) : (
                      <Badge tone="neutral">Não ancorado</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModuleTableCard>
      )}
    </div>
  );
}
