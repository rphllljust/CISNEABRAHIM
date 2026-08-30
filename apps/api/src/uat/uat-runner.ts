import { UAT_SCENARIOS } from './uat-scenarios';
import { computeUatVerdict } from './uat-verdict';
import type { UatDefect, UatProfileCheck, UatScenarioResult } from './uat-types';

export const UAT_OPEN_DEFECTS: UatDefect[] = [];

export function runEngineeringUatReport(input: {
  scenarioResults: UatScenarioResult[];
  profileChecks: UatProfileCheck[];
  defects?: UatDefect[];
}): ReturnType<typeof computeUatVerdict> & { scenarios: typeof UAT_SCENARIOS } {
  const verdict = computeUatVerdict({
    scenarioResults: input.scenarioResults,
    profileChecks: input.profileChecks,
    defects: input.defects ?? UAT_OPEN_DEFECTS,
  });
  return { ...verdict, scenarios: UAT_SCENARIOS };
}
