import { describe, expect, it } from 'vitest';
import { EXECUTION_EVIDENCE_KINDS } from '../types/service-order-execution.types';
import {
  allRequiredEvidenceSatisfied,
  buildRequirementCoverage,
  collectSatisfiedEvidenceKinds,
  labelForEvidenceKind,
} from './execution-requirements';

describe('execution-requirements', () => {
  it('labels evidence kinds in Portuguese', () => {
    expect(labelForEvidenceKind(EXECUTION_EVIDENCE_KINDS.Observation)).toBe('Observação');
    expect(labelForEvidenceKind(EXECUTION_EVIDENCE_KINDS.Photo)).toBe('Foto');
  });

  it('collects satisfied kinds from entries and evidence', () => {
    const satisfied = collectSatisfiedEvidenceKinds({
      serviceOrderId: 'order-1',
      status: 'IN_EXECUTION',
      entries: [
        {
          id: 'e1',
          serviceOrderId: 'order-1',
          entryType: 'OBSERVATION',
          evidenceKind: 'OBSERVATION',
          quantityValue: null,
          quantityUnitCode: null,
          textValue: 'ok',
          context: {},
          actorIdentityId: 'actor',
          recordedAt: '2026-01-01T00:00:00.000Z',
          rowVersion: 1,
        },
      ],
      evidence: [
        {
          id: 'ev1',
          serviceOrderId: 'order-1',
          evidenceKind: 'PHOTO',
          payload: { fileName: 'foto.jpg' },
          actorIdentityId: 'actor',
          recordedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      occurrences: [],
      comparison: {
        quantities: [],
        resources: [],
        periods: [],
        occurrenceCount: 0,
        entryCount: 1,
      },
    });

    expect(satisfied.has('OBSERVATION')).toBe(true);
    expect(satisfied.has('PHOTO')).toBe(true);
  });

  it('builds coverage and detects missing required evidence', () => {
    const requirements = [
      {
        evidenceKind: 'OBSERVATION',
        requirementLevel: 'REQUIRED',
        config: null,
        sortOrder: 1,
      },
      {
        evidenceKind: 'QUANTITY',
        requirementLevel: 'REQUIRED',
        config: null,
        sortOrder: 2,
      },
    ];
    const satisfied = new Set(['OBSERVATION']);
    const coverage = buildRequirementCoverage(requirements, satisfied);
    expect(coverage[0]?.satisfied).toBe(true);
    expect(coverage[1]?.satisfied).toBe(false);
    expect(allRequiredEvidenceSatisfied(requirements, satisfied)).toBe(false);
    expect(allRequiredEvidenceSatisfied(requirements, new Set(['OBSERVATION', 'QUANTITY']))).toBe(
      true,
    );
  });
});
