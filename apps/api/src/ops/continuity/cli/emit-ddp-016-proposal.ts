#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findRepoRoot } from '../../cd/cd-paths';
import { buildDdp016Proposal, summarizeDrValidation } from '../ddp-016-proposal';
import { readDrStatusFile } from '../../dr/dr-verify';

function resolveDrStatusPath(env: NodeJS.ProcessEnv): string {
  const isolatedRoot = env['DR_ISOLATED_ROOT']?.trim() ?? join('.backup', 'dr-drill');
  return env['DR_STATUS_FILE']?.trim() ?? join(isolatedRoot, 'status', 'latest.json');
}

async function main(): Promise<void> {
  const env = process.env;
  const statusPath = resolveDrStatusPath(env);
  const drill = await readDrStatusFile(statusPath);
  const measuredDr = drill
    ? {
        rpoMeasuredMs: drill.metrics.rpoMeasuredMs,
        rtoMeasuredMs: drill.metrics.rtoMeasuredMs,
      }
    : null;

  const proposal = buildDdp016Proposal(
    env,
    measuredDr,
    new Date(),
    summarizeDrValidation(drill, statusPath),
  );
  const repoRoot = findRepoRoot();
  const outputPath = resolve(repoRoot, 'docs/19-operations/ddp-016-rpo-rto-proposal.json');
  writeFileSync(outputPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(proposal, null, 2));
}

main().catch((error) => {
  console.error('[ddp-016] fatal', error);
  process.exitCode = 1;
});
