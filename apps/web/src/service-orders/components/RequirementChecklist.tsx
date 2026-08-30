import type { RequirementCoverageRow } from '../utils/execution-requirements';

type RequirementChecklistProps = {
  items: RequirementCoverageRow[];
  instructions: string | null;
};

export function RequirementChecklist({ items, instructions }: RequirementChecklistProps) {
  const pendingRequired = items.filter((item) => item.requirementLevel === 'REQUIRED' && !item.satisfied);

  return (
    <section className="execution-section" aria-labelledby="execution-requirements-title">
      <h2 id="execution-requirements-title">Requisitos</h2>
      {instructions ? (
        <div className="execution-instructions">
          <h3 className="execution-instructions__title">Instruções</h3>
          <p>{instructions}</p>
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="execution-empty">Nenhum requisito de execução para este serviço.</p>
      ) : (
        <>
          {pendingRequired.length > 0 ? (
            <div className="execution-error-summary" role="alert" aria-live="assertive">
              <p>
                Faltam {pendingRequired.length} requisito(s) obrigatório(s):{' '}
                {pendingRequired.map((item) => item.label).join(', ')}.
              </p>
            </div>
          ) : null}
          <ul className="execution-checklist">
            {items.map((item) => (
              <li
                key={item.evidenceKind}
                className={
                  item.satisfied
                    ? 'execution-checklist__item execution-checklist__item--done'
                    : 'execution-checklist__item execution-checklist__item--pending'
                }
              >
                <span className="execution-checklist__status" aria-hidden="true">
                  {item.satisfied ? '✓' : '○'}
                </span>
                <span className="execution-checklist__label">
                  {item.label}
                  {item.requirementLevel === 'REQUIRED' ? (
                    <span className="execution-checklist__required"> (obrigatório)</span>
                  ) : null}
                </span>
                <span className="execution-sr-only">
                  {item.satisfied ? 'concluído' : 'pendente'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
