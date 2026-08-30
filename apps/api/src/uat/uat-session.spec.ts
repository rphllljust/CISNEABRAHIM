import { describe, expect, it } from 'vitest';
import { createPendingReadinessEvidence } from '../ops/readiness/readiness-evidence';
import { evaluateOperationalEngineeringState } from '../ops/readiness/operational-readiness';
import {
  beginUatSession,
  buildUatSessionChecklist,
  closeUatSession,
  summarizeUatSession,
  UAT_UX_DIMENSIONS,
} from './uat-session';

describe('manual UAT session checklist', () => {
  it('derives checklist items from real UAT scenarios and UX dimensions', () => {
    const checklist = buildUatSessionChecklist();
    expect(checklist.items.length).toBe(3 * UAT_UX_DIMENSIONS.length * 2);
    expect(checklist.status).toBe('TEMPLATE');
    expect(checklist.items.every((item) => item.verdict === null)).toBe(true);
  });

  it('begins session without marking UAT completed', () => {
    const record = createPendingReadinessEvidence();
    const checklist = buildUatSessionChecklist();
    const started = beginUatSession(record, checklist, {
      performedBy: 'operator-1',
      environment: 'pilot',
      releaseCandidate: { commitSha: 'abc', artifactDigest: null, version: '0.1.0' },
    });
    expect(started.error).toBeUndefined();
    expect(started.record.manualUatUx.status).toBe('IN_PROGRESS');
    expect(started.record.manualUatUx.engineeringReadiness).toBe('UAT_SESSION_IN_PROGRESS');
    expect(started.checklist.status).toBe('IN_PROGRESS');
  });

  it('closes session only when all items have verdict', () => {
    const record = createPendingReadinessEvidence();
    const checklist = buildUatSessionChecklist();
    const started = beginUatSession(record, checklist, {
      performedBy: 'operator-1',
      environment: 'pilot',
      releaseCandidate: { commitSha: 'abc', artifactDigest: null, version: '0.1.0' },
    });
    const partial = closeUatSession(started.record, started.checklist, {
      closedBy: 'operator-1',
      items: started.checklist.items.slice(0, 2).map((item) => ({ id: item.id, verdict: 'PASS' as const, notes: null })),
    });
    expect(partial.error).toContain('still without verdict');

    const closed = closeUatSession(started.record, started.checklist, {
      closedBy: 'operator-1',
      items: started.checklist.items.map((item) => ({ id: item.id, verdict: 'PASS' as const, notes: null })),
    });
    expect(closed.error).toBeUndefined();
    expect(closed.record.manualUatUx.status).toBe('PASSED');
    expect(closed.record.manualUatUx.engineeringReadiness).toBe('UAT_COMPLETED');
    expect(summarizeUatSession(closed.checklist).pending).toBe(0);
  });

  it('reports UAT_READY_TO_EXECUTE when engineering ready and session not started', () => {
    const state = evaluateOperationalEngineeringState({
      engineeringReadiness: 'READY',
      record: createPendingReadinessEvidence(),
    });
    expect(state.uat).toBe('UAT_READY_TO_EXECUTE');
    expect(state.uatReady).toBe(true);
    expect(state.pilot).toBe('PILOT_READY_TO_START');
  });
});
