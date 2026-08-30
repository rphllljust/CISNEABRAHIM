#!/usr/bin/env node
import { runProdInfrastructureValidation } from '../prod-validation';

async function main(): Promise<void> {
  const result = runProdInfrastructureValidation(process.env);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[prod-validate] fatal', error);
  process.exitCode = 1;
});
