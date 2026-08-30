import { buildUatUxScenarioCatalog } from '../readiness/readiness-established-baseline';
import type { EngineeringReadinessDecision } from '../readiness/readiness-types';
import type {
  ManualUatEngineeringReadiness,
  ReadinessEvidenceRecord,
} from '../readiness/readiness-evidence-types';
import { evaluatePilotEngineeringReadiness } from '../pilot/pilot-readiness';
import { buildUatSessionChecklist } from '../../uat/uat-session';

export type OperationalEngineeringState = {
  pilot: import('../readiness/readiness-evidence-types').PilotEngineeringReadiness;
  uat: ManualUatEngineeringReadiness;
  pilotReady: boolean;
  uatReady: boolean;
  pilotBlockers: string[];
  uatBlockers: string[];
  scenarioCount: number;
  checklistItemCount: number;
};

export function evaluateUatEngineeringReadiness(input: {
  engineeringReadiness: EngineeringReadinessDecision;
  record: ReadinessEvidenceRecord;
}): {
  status: ManualUatEngineeringReadiness;
  ready: boolean;
  blockers: string[];
  scenarioCount: number;
  checklistItemCount: number;
} {
  const blockers: string[] = [];
  const catalog = buildUatUxScenarioCatalog();
  const checklist = buildUatSessionChecklist(catalog);

  if (input.engineeringReadiness !== 'READY') {
    blockers.push('ENGINEERING_READINESS_NOT_READY');
  }

  if (['PASSED', 'PASSED_WITH_OBSERVATIONS', 'FAILED'].includes(input.record.manualUatUx.status)) {
    return {
      status: 'UAT_COMPLETED',
      ready: false,
      blockers: [`Manual UAT already completed (status=${input.record.manualUatUx.status})`],
      scenarioCount: catalog.scenarios.length,
      checklistItemCount: checklist.items.length,
    };
  }

  if (input.record.manualUatUx.status === 'IN_PROGRESS') {
    return {
      status: 'UAT_SESSION_IN_PROGRESS',
      ready: false,
      blockers: ['UAT session already in progress — complete or abort before re-opening'],
      scenarioCount: catalog.scenarios.length,
      checklistItemCount: checklist.items.length,
    };
  }

  if (catalog.scenarios.length === 0) {
    blockers.push('UAT_SCENARIO_CATALOG_EMPTY');
  }

  if (checklist.items.length === 0) {
    blockers.push('UAT_CHECKLIST_EMPTY');
  }

  if (blockers.length > 0) {
    return {
      status: 'NOT_READY',
      ready: false,
      blockers,
      scenarioCount: catalog.scenarios.length,
      checklistItemCount: checklist.items.length,
    };
  }

  return {
    status: 'UAT_READY_TO_EXECUTE',
    ready: true,
    blockers: [],
    scenarioCount: catalog.scenarios.length,
    checklistItemCount: checklist.items.length,
  };
}

export function evaluateOperationalEngineeringState(input: {
  engineeringReadiness: EngineeringReadinessDecision;
  record: ReadinessEvidenceRecord;
  env?: NodeJS.ProcessEnv;
}): OperationalEngineeringState {
  const pilot = evaluatePilotEngineeringReadiness(input);
  const uat = evaluateUatEngineeringReadiness(input);

  return {
    pilot: pilot.status,
    uat: uat.status,
    pilotReady: pilot.ready,
    uatReady: uat.ready,
    pilotBlockers: pilot.blockers,
    uatBlockers: uat.blockers,
    scenarioCount: uat.scenarioCount,
    checklistItemCount: uat.checklistItemCount,
  };
}
