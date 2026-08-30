#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { runHmlDeploy } from '../hml-deploy';

config({ path: resolve(process.cwd(), '.env.hml') });
config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const result = await runHmlDeploy(process.env);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[hml-deploy] fatal', error);
  process.exitCode = 1;
});
