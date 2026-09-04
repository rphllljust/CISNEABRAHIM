import { AccessAdminApiError, listSodConflicts } from '../api/access-admin-api';
import { mapAccessAdminErrorToMessage } from '../api/access-admin-error-messages';
import { useAsyncResource } from '../hooks/useAccessAdminData';
import type { SodConflict } from '../types';
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

export function SodConflictsTab() {
  const { state, refresh } = useAsyncResource<SodConflict[]>(() => listSodConflicts());

  if (state.phase === 'loading') {
    return <LoadingState label="Carregando conflitos SoD…" />;
  }

  if (state.phase === 'error') {
    const message =
      state.error instanceof AccessAdminApiError
        ? mapAccessAdminErrorToMessage(state.error.code, state.error.status)
        : 'Não foi possível carregar os conflitos SoD.';
    return <ErrorState title="Conflitos SoD" message={message} onRetry={refresh} />;
  }

  const conflicts = state.data;

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-gray-500">
        Os conflitos de segregação de funções (SoD) são calculados no servidor a partir do
        catálogo SoD. Este é um guarda de engenharia — o cliente não decide autoridade.
        Regra SOD-012 permanece consultiva enquanto a DDP-015 estiver aberta.
      </p>

      {conflicts.length === 0 ? (
        <EmptyState
          title="Nenhum conflito SoD"
          description="O servidor não reportou conflitos de segregação de funções no momento."
        />
      ) : (
        <ModuleTableCard>
          <table className={moduleTableClass} aria-label="Conflitos SoD">
            <thead className={moduleTableHeadClass}>
              <tr>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Identidade
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Roles
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Regra
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Capacidades conflitantes
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conflicts.map((conflict) => (
                <tr key={conflict.identityId} className={moduleTableRowClass}>
                  <td className={moduleTableCellClass}>
                    {conflict.identityLogin ?? conflict.identityId}
                  </td>
                  <td className={moduleTableCellClass}>
                    <span className="font-mono text-xs text-gray-600">
                      {conflict.roleCodes.join(', ') || '—'}
                    </span>
                  </td>
                  <td className={moduleTableCellClass}>
                    <span className="font-mono text-xs text-gray-600">{conflict.rule}</span>
                  </td>
                  <td className={moduleTableCellClass}>
                    <span className="font-mono text-xs text-gray-600">
                      {conflict.capabilityA} × {conflict.capabilityB}
                    </span>
                  </td>
                  <td className={moduleTableCellClass}>
                    <Badge tone="error">{conflict.status}</Badge>
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
