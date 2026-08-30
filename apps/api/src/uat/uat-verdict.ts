import type { UatDefect, UatDefectSeverity, UatScenarioResult, UatProfileCheck, UatVerdict } from './uat-types';
import { blocksGoLive } from './uat-types';

export function sortDefectsBySeverity(defects: UatDefect[]): UatDefect[] {
  const order: UatDefectSeverity[] = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR'];
  return [...defects].sort(
    (left, right) => order.indexOf(left.severity) - order.indexOf(right.severity),
  );
}

export function computeUatVerdict(input: {
  scenarioResults: UatScenarioResult[];
  profileChecks: UatProfileCheck[];
  defects: UatDefect[];
  goLiveBlockers?: string[];
}): UatVerdict {
  const openBlockers = sortDefectsBySeverity(
    input.defects.filter((defect) => defect.status === 'OPEN' && blocksGoLive(defect.severity)),
  );

  const scenarioFailed = input.scenarioResults.some((result) => result.status === 'FAIL');
  const profileFailed = input.profileChecks.some((check) => !check.passed);
  const hasOpenBlockers = openBlockers.length > 0;

  const status =
    scenarioFailed || profileFailed || hasOpenBlockers ? 'REJECTED' : 'APPROVED';

  return {
    status,
    scenarioResults: input.scenarioResults,
    profileChecks: input.profileChecks,
    openBlockers,
    goLiveBlockers: input.goLiveBlockers ?? [
      'BUSINESS_STAKEHOLDER_SIGN_OFF_PENDING',
      'RPO_RTO_TARGET_NOT_DEFINED',
    ],
    evaluatedAt: new Date().toISOString(),
  };
}
