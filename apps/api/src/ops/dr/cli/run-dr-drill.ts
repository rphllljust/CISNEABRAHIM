#!/usr/bin/env node
import { runDrDrill } from '../dr-runner';
import { formatDrMetricsSummary } from '../dr-metrics';
import { DR_SCENARIOS } from '../dr-types';
import { resolveDrScenario } from '../dr-config';

async function main(): Promise<void> {
  const scenario = resolveDrScenario();
  console.log('[dr] scenario', scenario, DR_SCENARIOS[scenario].label);

  const result = await runDrDrill();
  console.log(
    JSON.stringify({
      status: result.status,
      scenario: result.scenario,
      checks: result.checks,
      metrics: result.metrics,
      summary: formatDrMetricsSummary(result.metrics),
      error: result.error ?? null,
    }),
  );

  if (result.status !== 'PASS') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[dr] fatal', error);
  process.exitCode = 1;
});
