#!/usr/bin/env node
import { runEngineeringUatReport, UAT_OPEN_DEFECTS } from '../uat-runner';

const report = runEngineeringUatReport({
  scenarioResults: [],
  profileChecks: [],
  defects: UAT_OPEN_DEFECTS,
});

console.log(
  JSON.stringify(
    {
      ...report,
      note: 'Execute pnpm test:uat with TEST_DATABASE_URL for full scenario evidence.',
    },
    null,
    2,
  ),
);

if (report.status !== 'APPROVED') {
  process.exitCode = 1;
}
