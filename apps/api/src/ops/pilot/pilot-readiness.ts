import type { EngineeringReadinessDecision } from '../readiness/readiness-types';
import type { PilotEngineeringReadiness, ReadinessEvidenceRecord } from '../readiness/readiness-evidence-types';
import { buildPilotFlowCatalog } from './pilot-flow-catalog';
import { validatePreFlightCatalog } from './pilot-pre-flight';
import { buildPilotTechnicalCriteria } from './pilot-technical-criteria';

export type PilotReadinessEvaluation = {
  status: PilotEngineeringReadiness;
  ready: boolean;
  blockers: string[];
  flowCount: number;
  criteriaCount: number;
};

export function evaluatePilotEngineeringReadiness(input: {
  engineeringReadiness: EngineeringReadinessDecision;
  record: ReadinessEvidenceRecord;
  env?: NodeJS.ProcessEnv;
}): PilotReadinessEvaluation {
  const env = input.env ?? process.env;
  const blockers: string[] = [];
  const flowCatalog = buildPilotFlowCatalog();
  const criteria = buildPilotTechnicalCriteria(env);
  const preFlight = validatePreFlightCatalog();

  if (input.engineeringReadiness !== 'READY') {
    blockers.push('ENGINEERING_READINESS_NOT_READY');
  }

  if (input.record.pilot.phase !== 'NOT_STARTED') {
    return {
      status: 'PILOT_STARTED',
      ready: false,
      blockers: [`Pilot already started (phase=${input.record.pilot.phase})`],
      flowCount: flowCatalog.flows.length,
      criteriaCount: criteria.length,
    };
  }

  if (flowCatalog.flows.length === 0) {
    blockers.push('PILOT_FLOW_CATALOG_EMPTY');
  }

  if (!preFlight.ok) {
    blockers.push(`PILOT_PRE_FLIGHT_CATALOG_INCOMPLETE: ${preFlight.missingConcerns.join(',')}`);
  }

  if (blockers.length > 0) {
    return {
      status: 'NOT_READY',
      ready: false,
      blockers,
      flowCount: flowCatalog.flows.length,
      criteriaCount: criteria.length,
    };
  }

  return {
    status: 'PILOT_READY_TO_START',
    ready: true,
    blockers: [],
    flowCount: flowCatalog.flows.length,
    criteriaCount: criteria.length,
  };
}
