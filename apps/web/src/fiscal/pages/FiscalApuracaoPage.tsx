import { useCallback, useRef, useState } from 'react';
import { Button, EmptyState, Money } from '../../ui';
import {
  ModulePage,
  ModulePageHeader,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { ProcessingBanner } from '../../financial-ui/ProcessingBanner';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getTaxCalculation, reproduceTaxCalculation } from '../api/fiscal-api';
import { mapFiscalErrorToMessage } from '../api/fiscal-error-messages';
import type { TaxCalculation, TaxReproduction } from '../types/fiscal.types';

export function FiscalApuracaoPage() {
  const [calculationId, setCalculationId] = useState('');
  const [activeId, setActiveId] = useState('');
  const [reproduction, setReproduction] = useState<TaxReproduction | null>(null);
  const [processing, setProcessing] = useState(false);
  const inflight = useRef(false);
  const loader = useCallback((signal?: AbortSignal) => getTaxCalculation(activeId, signal), [activeId]);
  const { state, reload } = useBackofficeQuery<TaxCalculation>({
    loader,
    mapError: mapFiscalErrorToMessage,
    enabled: Boolean(activeId),
    autoLoad: Boolean(activeId),
  });

  const gate = activeId
    ? renderQueryGate(
        'Apuração',
        'Carregando apuração…',
        'Você não tem permissão para consultar apurações fiscais.',
        state,
        () => void reload(),
      )
    : null;

  async function handleReproduce() {
    if (!activeId || inflight.current) {
      return;
    }
    inflight.current = true;
    setProcessing(true);
    try {
      setReproduction(await reproduceTaxCalculation(activeId));
    } finally {
      inflight.current = false;
      setProcessing(false);
    }
  }

  return (
    <ModulePage>
      <ModulePageHeader
        title="Apuração"
        description="Resultados e reprodução vêm do motor tributário versionado. Esta tela não calcula imposto."
      />
      <RecordLookupCard
        fieldId="tax-calculation-id"
        label="Identificador da apuração"
        value={calculationId}
        onChange={setCalculationId}
        onSubmit={() => {
          setReproduction(null);
          setActiveId(calculationId.trim());
        }}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      {gate}
      {!activeId ? (
        <EmptyState
          title="Nenhuma apuração carregada"
          description="Consulte pelo identificador gerado pelo servidor. Alíquotas oficiais não são inventadas nesta interface."
        />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                { label: 'Regra', value: state.data.ruleCode },
                { label: 'Versão', value: String(state.data.versionNumber) },
                { label: 'Base', value: <Money value={state.data.baseAmount} /> },
                { label: 'Alíquota persistida', value: state.data.rate ?? '—' },
                { label: 'Resultado', value: <Money value={state.data.resultAmount} emphasis /> },
              ]}
            />
          </div>
          <div className="mb-4">
            <Button type="button" onClick={() => void handleReproduce()} loading={processing} disabled={processing}>
              Reproduzir no servidor
            </Button>
          </div>
          {processing ? <div className="mb-4"><ProcessingBanner /></div> : null}
          {reproduction ? (
            <p className="mb-4 text-sm" role="status">
              Reprodução {reproduction.matches ? 'coincide' : 'diverge'} do resultado persistido. Valor recompute:{' '}
              <Money value={reproduction.recomputed.resultAmount} />
            </p>
          ) : null}
          <ModuleTableCard>
            <table className={moduleTableClass} aria-label="Linhas da apuração">
              <thead className={moduleTableHeadClass}>
                <tr>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Componente
                  </th>
                  <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                    Base
                  </th>
                  <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                    Resultado
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.data.lines.map((line) => (
                  <tr key={line.lineNumber} className={moduleTableRowClass}>
                    <td className={moduleTableCellClass}>{line.componentLabel}</td>
                    <td className={`${moduleTableCellClass} text-right`}>
                      <Money value={line.baseAmount} />
                    </td>
                    <td className={`${moduleTableCellClass} text-right`}>
                      <Money value={line.resultAmount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ModuleTableCard>
        </>
      ) : null}
    </ModulePage>
  );
}
