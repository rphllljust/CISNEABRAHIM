import type { ExecutionEntry, ExecutionEvidence, ExecutionOccurrence } from '../types/service-order-execution.types';
import { labelForEvidenceKind } from '../utils/execution-requirements';

type TimelineItem =
  | { kind: 'entry'; at: string; label: string; detail: string }
  | { kind: 'evidence'; at: string; label: string; detail: string }
  | { kind: 'occurrence'; at: string; label: string; detail: string };

function mapEntries(entries: ExecutionEntry[]): TimelineItem[] {
  return entries.map((entry) => {
    let detail = entry.textValue ?? entry.quantityValue ?? 'Registro';
    if (entry.quantityValue && entry.quantityUnitCode) {
      detail = `${entry.quantityValue} ${entry.quantityUnitCode}`;
    }
    return {
      kind: 'entry',
      at: entry.recordedAt,
      label: entry.evidenceKind ? labelForEvidenceKind(entry.evidenceKind) : entry.entryType,
      detail,
    };
  });
}

function mapEvidence(evidence: ExecutionEvidence[]): TimelineItem[] {
  return evidence.map((item) => ({
    kind: 'evidence',
    at: item.recordedAt,
    label: labelForEvidenceKind(item.evidenceKind),
    detail:
      typeof item.payload.fileName === 'string'
        ? item.payload.fileName
        : 'Evidência registrada',
  }));
}

function mapOccurrences(occurrences: ExecutionOccurrence[]): TimelineItem[] {
  return occurrences.map((item) => ({
    kind: 'occurrence',
    at: item.recordedAt,
    label: item.occurrenceCode,
    detail: item.description,
  }));
}

type ExecutionTimelineProps = {
  entries: ExecutionEntry[];
  evidence: ExecutionEvidence[];
  occurrences: ExecutionOccurrence[];
};

export function ExecutionTimeline({ entries, evidence, occurrences }: ExecutionTimelineProps) {
  const items = [...mapEntries(entries), ...mapEvidence(evidence), ...mapOccurrences(occurrences)].sort(
    (left, right) => Date.parse(right.at) - Date.parse(left.at),
  );

  return (
    <section className="execution-section" aria-labelledby="execution-timeline-title">
      <h2 id="execution-timeline-title">Linha do tempo</h2>
      {items.length === 0 ? (
        <p className="execution-empty">Nenhum registro ainda.</p>
      ) : (
        <ol className="execution-timeline" aria-live="polite">
          {items.map((item, index) => (
            <li key={`${item.kind}-${item.at}-${index}`} className={`execution-timeline__item execution-timeline__item--${item.kind}`}>
              <time className="execution-timeline__time" dateTime={item.at}>
                {new Date(item.at).toLocaleString()}
              </time>
              <p className="execution-timeline__label">{item.label}</p>
              <p className="execution-timeline__detail">{item.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
