import { describe, expect, it } from 'vitest';
import { createPendingReadinessEvidence } from '../readiness/readiness-evidence';
import { evaluatePilotEngineeringReadiness } from './pilot-readiness';
import { validatePilotStartTimestamp, registerPilotStart } from './pilot-start';
import { computeObservationEndsAt } from './pilot-observation-window';
import { buildPilotFlowCatalog } from './pilot-flow-catalog';
import { buildPilotTechnicalCriteria, buildPilotExitCriteriaCatalog } from './pilot-technical-criteria';
import { validatePreFlightCatalog } from './pilot-pre-flight';

describe('pilot engineering readiness', () => {
  it('maps three operational flows from UAT scenarios', () => {
    const catalog = buildPilotFlowCatalog();
    expect(catalog.flows).toHaveLength(3);
    expect(catalog.steps.some((step) => step.id === 'service_order_release')).toBe(true);
    expect(catalog.steps.some((step) => step.id === 'service_order_cancel')).toBe(true);
  });

  it('defines measurable technical criteria without commercial thresholds', () => {
    const criteria = buildPilotTechnicalCriteria({});
    expect(criteria.length).toBeGreaterThanOrEqual(8);
    expect(criteria.every((entry) => entry.threshold.length > 0)).toBe(true);
    expect(buildPilotExitCriteriaCatalog({}).some((entry) => entry.id === 'min_observation_days')).toBe(true);
  });

  it('reports PILOT_READY_TO_START when engineering is ready and pilot not started', () => {
    const record = createPendingReadinessEvidence();
    const evaluation = evaluatePilotEngineeringReadiness({
      engineeringReadiness: 'READY',
      record,
    });
    expect(evaluation.status).toBe('PILOT_READY_TO_START');
    expect(evaluation.ready).toBe(true);
  });

  it('rejects backdated pilot start timestamps', () => {
    const now = new Date('2026-08-30T12:00:00.000Z');
    const backdated = new Date('2026-08-29T12:00:00.000Z');
    expect(validatePilotStartTimestamp(backdated, now)).toContain('backdated');
  });

  it('computes observation end automatically from startedAt + min days', () => {
    const endsAt = computeObservationEndsAt('2026-08-01T00:00:00.000Z', 14);
    expect(endsAt).toBe('2026-08-15T00:00:00.000Z');
  });

  it('registers pilot start without changing phase to EXIT_READY', () => {
    const record = createPendingReadinessEvidence();
    const now = new Date('2026-08-30T12:00:00.000Z');
    const result = registerPilotStart(
      record,
      {
        authorizedBy: 'sponsor',
        responsible: 'ops-lead',
        environment: 'pilot',
        releaseCandidate: { commitSha: 'abc', artifactDigest: null, version: '0.1.0-pilot' },
      },
      now,
    );
    expect(result.validation.ok).toBe(true);
    if (result.validation.ok) {
      expect(result.record.pilot.phase).toBe('OBSERVATION');
      expect(result.record.pilot.engineeringReadiness).toBe('PILOT_STARTED');
      expect(result.record.pilot.observationEndsAt).toBe('2026-09-13T12:00:00.000Z');
    }
  });

  it('validates pre-flight catalog covers required concerns', () => {
    const validation = validatePreFlightCatalog();
    expect(validation.ok).toBe(true);
    expect(validation.missingConcerns).toEqual([]);
  });
});
