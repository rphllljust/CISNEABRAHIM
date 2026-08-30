import { useId, useState } from 'react';

type OccurrenceFormProps = {
  open: boolean;
  disabled?: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { occurrenceCode: string; description: string }) => void;
};

export function OccurrenceForm({ open, disabled = false, busy = false, onClose, onSubmit }: OccurrenceFormProps) {
  const formId = useId();
  const [occurrenceCode, setOccurrenceCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  return (
    <section className="execution-section execution-occurrence" aria-labelledby={`${formId}-title`}>
      <div className="execution-occurrence__header">
        <h2 id={`${formId}-title`}>Registrar ocorrência</h2>
        <button type="button" className="button-link" onClick={onClose}>
          Fechar
        </button>
      </div>
      <form
        id={formId}
        className="execution-occurrence__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!occurrenceCode.trim() || !description.trim()) {
            setError('Informe o código e a descrição da ocorrência.');
            return;
          }
          setError(null);
          onSubmit({ occurrenceCode: occurrenceCode.trim(), description: description.trim() });
        }}
      >
        {error ? (
          <div className="execution-error-summary" role="alert">
            <p>{error}</p>
          </div>
        ) : null}
        <div className="form-field">
          <label htmlFor={`${formId}-code`}>Código</label>
          <input
            id={`${formId}-code`}
            name="occurrenceCode"
            value={occurrenceCode}
            disabled={disabled || busy}
            onChange={(event) => setOccurrenceCode(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor={`${formId}-description`}>Descrição</label>
          <textarea
            id={`${formId}-description`}
            name="description"
            className="execution-textarea"
            rows={3}
            value={description}
            disabled={disabled || busy}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="button-row">
          <button type="button" className="button-secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={disabled || busy}>
            {busy ? 'Salvando…' : 'Registrar ocorrência'}
          </button>
        </div>
      </form>
    </section>
  );
}
