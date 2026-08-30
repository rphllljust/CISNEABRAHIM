import { describe, expect, it } from 'vitest';
import { computeUatVerdict, sortDefectsBySeverity } from './uat-verdict';
import { blocksGoLive } from './uat-types';

describe('UAT verdict (Prompt 89)', () => {
  it('classifies BLOCKER and CRITICAL as go-live blockers', () => {
    expect(blocksGoLive('BLOCKER')).toBe(true);
    expect(blocksGoLive('CRITICAL')).toBe(true);
    expect(blocksGoLive('MAJOR')).toBe(false);
  });

  it('rejects UAT when open BLOCKER defects exist', () => {
    const verdict = computeUatVerdict({
      scenarioResults: [{ scenarioId: 'locacao', status: 'PASS', durationMs: 1 }],
      profileChecks: [],
      defects: [
        {
          id: 'DEF-001',
          severity: 'BLOCKER',
          status: 'OPEN',
          summary: 'Billing totals diverge from measurement',
        },
      ],
    });
    expect(verdict.status).toBe('REJECTED');
    expect(verdict.openBlockers).toHaveLength(1);
  });

  it('approves engineering UAT when automated gates pass', () => {
    const verdict = computeUatVerdict({
      scenarioResults: [
        { scenarioId: 'locacao', status: 'PASS', durationMs: 1 },
        { scenarioId: 'transporte', status: 'PASS', durationMs: 1 },
        { scenarioId: 'obra_composto', status: 'PASS', durationMs: 1 },
      ],
      profileChecks: [
        { profileId: 'executor', action: 'billing:prepare', expected: 'DENY', actual: 'DENY', passed: true },
      ],
      defects: [],
    });
    expect(verdict.status).toBe('APPROVED');
  });

  it('sorts defects by severity', () => {
    const sorted = sortDefectsBySeverity([
      { id: 'a', severity: 'MINOR', status: 'OPEN', summary: 'a' },
      { id: 'b', severity: 'BLOCKER', status: 'OPEN', summary: 'b' },
      { id: 'c', severity: 'MAJOR', status: 'OPEN', summary: 'c' },
    ]);
    expect(sorted.map((entry) => entry.severity)).toEqual(['BLOCKER', 'MAJOR', 'MINOR']);
  });
});
