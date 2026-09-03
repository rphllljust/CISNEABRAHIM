import { useCallback, useState } from 'react';
import { EmptyState } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getTaxRule } from '../api/fiscal-api';
import { mapFiscalErrorToMessage } from '../api/fiscal-error-messages';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import type { TaxRule } from '../types/fiscal.types';

export function FiscalTributosPage() {
  const [ruleId, setRuleId] = useState('');
  const [activeId, setActiveId] = useState('');
  const loader = useCallback((signal?: AbortSignal) => getTaxRule(activeId, signal), [activeId]);
  const { state, reload } = useBackofficeQuery<TaxRule>({
    loader,
    mapError: mapFiscalErrorToMessage,
    enabled: Boolean(activeId),
    autoLoad: Boolean(activeId),
  });

  const gate = activeId
    ? renderQueryGate(
        'Tributos',
        'Carregando regra tributária…',
        'Você não tem permissão para consultar regras tributárias.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Tributos"
        description="Consulta regras versionadas já persistidas. Alíquotas oficiais não são inventadas nesta interface."
      />
      <RecordLookupCard
        fieldId="tax-rule-id"
        label="Identificador da regra"
        value={ruleId}
        onChange={setRuleId}
        onSubmit={() => setActiveId(ruleId.trim())}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      {gate}
      {!activeId ? (
        <EmptyState
          title="Nenhuma regra carregada"
          description="Consulte uma regra tributária pelo identificador do servidor."
        />
      ) : null}
      {state.phase === 'ready' ? (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <DefinitionList
            items={[
              { label: 'Código', value: state.data.code },
              { label: 'Nome', value: state.data.name },
              {
                label: 'Status',
                value: <FinanceStatusBadge status={state.data.status} labels={{ ACTIVE: 'Ativa', DRAFT: 'Rascunho' }} />,
              },
              { label: 'Unidade', value: state.data.unitId },
            ]}
          />
        </div>
      ) : null}
    </ModulePage>
  );
}
