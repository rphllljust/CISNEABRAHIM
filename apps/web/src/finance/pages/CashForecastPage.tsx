import { useCallback, useState } from 'react';
import { EmptyState, Field, Input, Money } from '../../ui';
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
import { CreateRecordForm } from '../../financial-ui/VersionedActionForm';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getCashForecast } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import type { CashForecast } from '../types/finance.types';

export function CashForecastPage() {
  const [unitId, setUnitId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('BRL');
  const [asOf, setAsOf] = useState('');
  const [horizonEndsOn, setHorizonEndsOn] = useState('');
  const [query, setQuery] = useState<{ unitId: string; currencyCode: string; asOf?: string; horizonEndsOn?: string } | null>(
    null,
  );

  const loader = useCallback(
    (signal?: AbortSignal) =>
      getCashForecast(
        {
          unitId: query?.unitId ?? '',
          currencyCode: query?.currencyCode ?? 'BRL',
          asOf: query?.asOf,
          horizonEndsOn: query?.horizonEndsOn,
        },
        signal,
      ),
    [query],
  );
  const { state, reload } = useBackofficeQuery<CashForecast>({
    loader,
    mapError: mapFinanceErrorToMessage,
    enabled: Boolean(query),
    autoLoad: Boolean(query),
  });

  const gate = query
    ? renderQueryGate(
        'Previsão de caixa',
        'Projetando caixa…',
        'Você não tem permissão para consultar a previsão de caixa.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Previsão de caixa"
        description="Saldos projetados são os devolvidos pelo servidor. O navegador não soma títulos."
      />
      <CreateRecordForm
        title="Parâmetros da projeção"
        description="Unidade e moeda são enviados à API de forecast."
        submitLabel="Projetar"
        mapError={mapFinanceErrorToMessage}
        onSubmit={async () => {
          setQuery({
            unitId: unitId.trim(),
            currencyCode: currencyCode.trim() || 'BRL',
            asOf: asOf.trim() || undefined,
            horizonEndsOn: horizonEndsOn.trim() || undefined,
          });
        }}
      >
        <Field label="Unidade" htmlFor="forecast-unit" required>
          <Input id="forecast-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required />
        </Field>
        <Field label="Moeda" htmlFor="forecast-currency" required>
          <Input
            id="forecast-currency"
            value={currencyCode}
            onChange={(event) => setCurrencyCode(event.target.value)}
            required
          />
        </Field>
        <Field label="Posição em" htmlFor="forecast-as-of">
          <Input id="forecast-as-of" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
        </Field>
        <Field label="Horizonte até" htmlFor="forecast-horizon">
          <Input
            id="forecast-horizon"
            type="date"
            value={horizonEndsOn}
            onChange={(event) => setHorizonEndsOn(event.target.value)}
          />
        </Field>
      </CreateRecordForm>
      {gate}
      {!query ? (
        <EmptyState title="Nenhuma projeção carregada" description="Informe a unidade para consultar o servidor." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                { label: 'Status', value: state.data.status === 'NO_DATA' ? 'Sem dados' : 'Projetado' },
                {
                  label: 'Caixa realizado',
                  value: <Money value={state.data.realized.cashBalance} currencyCode={state.data.currencyCode} />,
                },
                {
                  label: 'Caixa projetado',
                  value: <Money value={state.data.projectedCash.amount} currencyCode={state.data.currencyCode} emphasis />,
                },
                {
                  label: 'Entradas previstas',
                  value: <Money value={state.data.forecast.inflows} currencyCode={state.data.currencyCode} />,
                },
                {
                  label: 'Saídas previstas',
                  value: <Money value={state.data.forecast.outflows} currencyCode={state.data.currencyCode} />,
                },
              ]}
            />
          </div>
          {state.data.lines.length === 0 ? (
            <EmptyState title="Sem linhas de forecast" description="O servidor não devolveu movimentos para o horizonte." />
          ) : (
            <ModuleTableCard>
              <table className={moduleTableClass} aria-label="Linhas da previsão de caixa">
                <thead className={moduleTableHeadClass}>
                  <tr>
                    <th scope="col" className={moduleTableHeaderCellClass}>Tipo</th>
                    <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>Valor informado</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.lines.map((line, index) => (
                    <tr key={`${line.kind}-${index}`} className={moduleTableRowClass}>
                      <td className={moduleTableCellClass}>{line.kind}</td>
                      <td className={`${moduleTableCellClass} text-right`}>
                        <Money value={line.amount} currencyCode={state.data.currencyCode} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ModuleTableCard>
          )}
        </>
      ) : null}
    </ModulePage>
  );
}
