import { useState } from 'react';
import { EmptyState, Field, Input } from '../../ui';
import {
  FilterCard,
  ModulePage,
  ModulePageHeader,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { ClosedPeriodBanner } from '../../financial-ui/ClosedPeriodBanner';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { PERIOD_STATUS_LABELS } from '../../financial-ui/labels';
import { MoneyActionForm } from '../../financial-ui/MoneyActionForm';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import { closePeriod, reopenPeriod } from '../api/accounting-api';
import { mapAccountingErrorToMessage } from '../api/accounting-error-messages';
import type { AccountingPeriod } from '../types/accounting.types';

export function PeriodClosePage() {
  const [periodId, setPeriodId] = useState('');
  const [rowVersion, setRowVersion] = useState('1');
  const [period, setPeriod] = useState<AccountingPeriod | null>(null);

  return (
    <ModulePage>
      <ModulePageHeader
        title="Fechamentos"
        description="Fechar ou reabrir competência envia a versão e a justificativa ao servidor. O navegador não decide o close."
      />
      <FilterCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Identificador do período" htmlFor="close-period-id">
            <Input id="close-period-id" value={periodId} onChange={(event) => setPeriodId(event.target.value)} />
          </Field>
          <Field label="Versão do período" htmlFor="close-row-version">
            <Input
              id="close-row-version"
              inputMode="numeric"
              value={rowVersion}
              onChange={(event) => setRowVersion(event.target.value)}
            />
          </Field>
        </div>
      </FilterCard>

      {!period ? (
        <EmptyState
          title="Nenhum fechamento carregado"
          description="Informe o período e a versão atuais. O resultado só aparece depois da resposta do servidor."
        />
      ) : (
        <>
          {period.status === 'CLOSED' ? <div className="mb-4"><ClosedPeriodBanner /></div> : null}
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                {
                  label: 'Status',
                  value: <FinanceStatusBadge status={period.status} labels={PERIOD_STATUS_LABELS} />,
                },
                { label: 'Código', value: period.code },
                { label: 'Início', value: period.startsOn },
                { label: 'Fim', value: period.endsOn },
                { label: 'Versão', value: String(period.rowVersion) },
                { label: 'Reaberturas', value: String(period.reopenCount) },
              ]}
            />
          </div>
          {period.closeChecks.length > 0 ? (
            <ModuleTableCard>
              <table className={moduleTableClass} aria-label="Checagens de fechamento">
                <thead className={moduleTableHeadClass}>
                  <tr>
                    <th scope="col" className={moduleTableHeaderCellClass}>
                      Checagem
                    </th>
                    <th scope="col" className={moduleTableHeaderCellClass}>
                      Resultado
                    </th>
                    <th scope="col" className={moduleTableHeaderCellClass}>
                      Bloqueia
                    </th>
                    <th scope="col" className={moduleTableHeaderCellClass}>
                      Detalhe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {period.closeChecks.map((check) => (
                    <tr key={check.kind} className={moduleTableRowClass}>
                      <td className={moduleTableCellClass}>{check.kind}</td>
                      <td className={moduleTableCellClass}>{check.result}</td>
                      <td className={moduleTableCellClass}>{check.blocking ? 'Sim' : 'Não'}</td>
                      <td className={`${moduleTableCellClass} whitespace-normal`}>{check.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ModuleTableCard>
          ) : null}
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MoneyActionForm
          title="Fechar período"
          description="O servidor avalia o checklist configurável. Quitação não é exigida pela política padrão."
          confirmTitle="Fechar período"
          confirmDescription="O close ocorre sob bloqueio do período no backend."
          confirmLabel="Fechar"
          reasonLabel="Justificativa"
          disabled={!periodId.trim()}
          mapError={mapAccountingErrorToMessage}
          onSubmit={async ({ reason }) => {
            const next = await closePeriod(periodId.trim(), {
              rowVersion: Number(rowVersion),
              reason: reason ?? '',
            });
            setPeriod(next);
            setRowVersion(String(next.rowVersion));
          }}
        />
        <MoneyActionForm
          title="Reabrir período"
          description="Reabertura exige permissão específica e justificativa no servidor."
          confirmTitle="Reabrir período"
          confirmDescription="Somente o backend autoriza a reabertura."
          confirmLabel="Reabrir"
          reasonLabel="Justificativa"
          disabled={!periodId.trim()}
          mapError={mapAccountingErrorToMessage}
          onSubmit={async ({ reason }) => {
            const next = await reopenPeriod(periodId.trim(), {
              rowVersion: Number(rowVersion),
              reason: reason ?? '',
            });
            setPeriod(next);
            setRowVersion(String(next.rowVersion));
          }}
        />
      </div>
    </ModulePage>
  );
}
