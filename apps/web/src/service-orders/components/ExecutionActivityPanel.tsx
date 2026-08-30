import { useId, useState } from 'react';
import {
  EXECUTION_EVIDENCE_KINDS,
  type ExecutionEvidenceKind,
} from '../types/service-order-execution.types';
import { isMeasuredEntryKind, labelForEvidenceKind } from '../utils/execution-requirements';

export type ActivitySubmitPayload =
  | { kind: typeof EXECUTION_EVIDENCE_KINDS.Observation; text: string }
  | { kind: typeof EXECUTION_EVIDENCE_KINDS.Quantity; quantityValue: string; unitCode: string }
  | { kind: typeof EXECUTION_EVIDENCE_KINDS.Mileage; value: string }
  | { kind: typeof EXECUTION_EVIDENCE_KINDS.HourMeter; value: string };

type ExecutionActivityPanelProps = {
  open: boolean;
  pendingKinds: ExecutionEvidenceKind[];
  defaultUnitCode: string | null;
  allowedUnits: string[];
  disabled?: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: ActivitySubmitPayload) => void;
};

export function ExecutionActivityPanel({
  open,
  pendingKinds,
  defaultUnitCode,
  allowedUnits,
  disabled = false,
  busy = false,
  onClose,
  onSubmit,
}: ExecutionActivityPanelProps) {
  const formId = useId();
  const [selectedKind, setSelectedKind] = useState<ExecutionEvidenceKind | ''>('');
  const [text, setText] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [unitCode, setUnitCode] = useState(defaultUnitCode ?? allowedUnits[0] ?? '');
  const [measuredValue, setMeasuredValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const activeKind = (selectedKind || pendingKinds[0] || '') as ExecutionEvidenceKind;

  return (
    <section className="execution-section execution-activity" aria-labelledby={`${formId}-title`}>
      <div className="execution-activity__header">
        <h2 id={`${formId}-title`}>Registrar atividade</h2>
        <button type="button" className="button-link" onClick={onClose}>
          Fechar
        </button>
      </div>
      <form
        className="execution-activity__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!activeKind) {
            setError('Selecione o tipo de registro.');
            return;
          }
          if (activeKind === EXECUTION_EVIDENCE_KINDS.Observation) {
            if (!text.trim()) {
              setError('Informe a observação.');
              return;
            }
            setError(null);
            onSubmit({ kind: EXECUTION_EVIDENCE_KINDS.Observation, text: text.trim() });
            return;
          }
          if (activeKind === EXECUTION_EVIDENCE_KINDS.Quantity) {
            if (!quantityValue.trim() || !unitCode.trim()) {
              setError('Informe quantidade e unidade.');
              return;
            }
            setError(null);
            onSubmit({
              kind: EXECUTION_EVIDENCE_KINDS.Quantity,
              quantityValue: quantityValue.trim(),
              unitCode: unitCode.trim(),
            });
            return;
          }
          if (isMeasuredEntryKind(activeKind)) {
            if (!measuredValue.trim()) {
              setError('Informe o valor medido.');
              return;
            }
            setError(null);
            onSubmit({
              kind:
                activeKind === EXECUTION_EVIDENCE_KINDS.Mileage
                  ? EXECUTION_EVIDENCE_KINDS.Mileage
                  : EXECUTION_EVIDENCE_KINDS.HourMeter,
              value: measuredValue.trim(),
            });
          }
        }}
      >
        {error ? (
          <div className="execution-error-summary" role="alert">
            <p>{error}</p>
          </div>
        ) : null}
        {pendingKinds.length > 1 ? (
          <div className="form-field">
            <label htmlFor={`${formId}-kind`}>Tipo</label>
            <select
              id={`${formId}-kind`}
              value={activeKind}
              disabled={disabled || busy}
              onChange={(event) => setSelectedKind(event.target.value as ExecutionEvidenceKind)}
            >
              {pendingKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {labelForEvidenceKind(kind)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {activeKind === EXECUTION_EVIDENCE_KINDS.Observation ? (
          <div className="form-field">
            <label htmlFor={`${formId}-text`}>Observação</label>
            <textarea
              id={`${formId}-text`}
              className="execution-textarea"
              rows={4}
              value={text}
              disabled={disabled || busy}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        ) : null}
        {activeKind === EXECUTION_EVIDENCE_KINDS.Quantity ? (
          <>
            <div className="form-field">
              <label htmlFor={`${formId}-quantity`}>Quantidade</label>
              <input
                id={`${formId}-quantity`}
                inputMode="decimal"
                value={quantityValue}
                disabled={disabled || busy}
                onChange={(event) => setQuantityValue(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor={`${formId}-unit`}>Unidade</label>
              {allowedUnits.length > 0 ? (
                <select
                  id={`${formId}-unit`}
                  value={unitCode}
                  disabled={disabled || busy}
                  onChange={(event) => setUnitCode(event.target.value)}
                >
                  {allowedUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${formId}-unit`}
                  value={unitCode}
                  disabled={disabled || busy}
                  onChange={(event) => setUnitCode(event.target.value)}
                />
              )}
            </div>
          </>
        ) : null}
        {isMeasuredEntryKind(activeKind) ? (
          <div className="form-field">
            <label htmlFor={`${formId}-measured`}>{labelForEvidenceKind(activeKind)}</label>
            <input
              id={`${formId}-measured`}
              inputMode="decimal"
              value={measuredValue}
              disabled={disabled || busy}
              onChange={(event) => setMeasuredValue(event.target.value)}
            />
          </div>
        ) : null}
        <div className="button-row">
          <button type="button" className="button-secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={disabled || busy}>
            {busy ? 'Salvando…' : 'Salvar registro'}
          </button>
        </div>
      </form>
    </section>
  );
}
