#!/usr/bin/env node
import { evaluateProductionReadinessGate } from '../readiness-gate';

async function main(): Promise<void> {
  const result = evaluateProductionReadinessGate();
  console.log(JSON.stringify(result, null, 2));
  if (result.decision !== 'GO') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[readiness-gate] fatal', error);
  process.exitCode = 1;
});
