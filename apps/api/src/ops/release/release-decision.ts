import type { RollbackDecisionThresholds, RollbackTrigger } from './release-types';

export function loadRollbackDecisionThresholds(
  env: NodeJS.ProcessEnv = process.env,
): RollbackDecisionThresholds {
  return {
    maxHttpErrorRate: readFloat(env['RELEASE_MAX_HTTP_ERROR_RATE'], 0.05),
    requireHealthOk: env['RELEASE_REQUIRE_HEALTH_OK'] !== 'false',
    maxCriticalBusinessFailures: readInt(env['RELEASE_MAX_CRITICAL_BUSINESS_FAILURES'], 0),
  };
}

export function evaluateRollbackDecision(
  signals: {
    httpErrorRate: number;
    healthOk: boolean;
    criticalBusinessFailures: number;
  },
  thresholds: RollbackDecisionThresholds = loadRollbackDecisionThresholds(),
): { shouldRollback: boolean; triggers: RollbackTrigger[] } {
  const triggers: RollbackTrigger[] = [];

  if (signals.httpErrorRate > thresholds.maxHttpErrorRate) {
    triggers.push('error_rate');
  }
  if (thresholds.requireHealthOk && !signals.healthOk) {
    triggers.push('health_failure');
  }
  if (signals.criticalBusinessFailures > thresholds.maxCriticalBusinessFailures) {
    triggers.push('critical_business_failure');
  }

  return { shouldRollback: triggers.length > 0, triggers };
}

function readInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readFloat(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
