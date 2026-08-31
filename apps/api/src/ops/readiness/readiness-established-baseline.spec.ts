import { describe, expect, it } from 'vitest';
import { UAT_SCENARIOS } from '../../uat/uat-scenarios';
import {
  buildReadinessEstablishedBaseline,
  buildUatUxScenarioCatalog,
  summarizePendingHumanActions,
} from './readiness-established-baseline';
import { createPendingReadinessEvidence } from './readiness-evidence';

describe('readiness established baseline', () => {
  it('derives UX scenario catalog from UAT scenarios without manual reconstruction', () => {
    const catalog = buildUatUxScenarioCatalog();
    expect(catalog.scenarios).toHaveLength(UAT_SCENARIOS.length);
    expect(catalog.scenarios.map((entry) => entry.id).sort()).toEqual(
      UAT_SCENARIOS.map((entry) => entry.id).sort(),
    );
    for (const entry of catalog.scenarios) {
      expect(entry.uxCriteria.length).toBeGreaterThan(0);
      expect(entry.automatedApiCoverage).toContain('uat-business.integration.spec.ts');
    }
  });

  it('classifies established facts vs human/event requirements', () => {
    const matrix = buildReadinessEstablishedBaseline();
    const classifications = new Set(matrix.items.map((item) => item.classification));

    expect(classifications.has('FACT_ALREADY_ESTABLISHED')).toBe(true);
    expect(classifications.has('DECISION_ALREADY_RECORDED')).toBe(true);
    expect(classifications.has('HUMAN_APPROVAL_REQUIRED')).toBe(true);
    expect(classifications.has('REAL_WORLD_EVENT_REQUIRED')).toBe(true);

    const humanItems = matrix.items.filter((item) => item.classification === 'HUMAN_APPROVAL_REQUIRED');
    expect(humanItems.some((item) => item.requirement.includes('sign-off'))).toBe(true);
    expect(humanItems.some((item) => item.requirement.includes('RPO/RTO'))).toBe(true);
  });

  it('does not require redocumenting business rules for sign-off', () => {
    const pending = createPendingReadinessEvidence();
    expect(pending.businessSignOff.derivedScopeReferences.length).toBeGreaterThan(0);
    expect(pending.businessSignOff.decisionStatement).toContain('versão e este escopo');
    expect(pending.businessSignOff.scope).toBe('operational-validation-authorization');
  });

  it('lists only genuine pending human actions', () => {
    const pending = summarizePendingHumanActions(buildReadinessEstablishedBaseline());
    expect(pending.length).toBe(4);
    expect(pending.some((entry) => entry.includes('sign-off'))).toBe(true);
    expect(pending.some((entry) => entry.includes('RPO/RTO'))).toBe(true);
    expect(pending.some((entry) => entry.includes('piloto'))).toBe(true);
    expect(pending.some((entry) => entry.includes('UAT/UX'))).toBe(true);
  });

  it('clears pending human actions when authorized evidence is complete', () => {
    const record = createPendingReadinessEvidence();
    record.rpoRto.decision = 'APPROVED';
    record.businessSignOff.decision = 'APPROVED';
    record.pilot.phase = 'OBSERVATION';
    record.pilot.startedAt = '2026-08-30T22:28:40.517Z';
    record.manualUatUx.status = 'PASSED';
    const pending = summarizePendingHumanActions(buildReadinessEstablishedBaseline(new Date(), record));
    expect(pending).toEqual([]);
  });
});
