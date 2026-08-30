#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findRepoRoot } from '../../ops/cd/cd-paths';
import { buildUatSessionChecklist } from '../uat-session';

function main(): void {
  const checklist = buildUatSessionChecklist();
  const repoRoot = findRepoRoot();
  const outputPath = resolve(repoRoot, 'docs/16-testing/uat-ux-session-checklist.json');
  writeFileSync(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, itemCount: checklist.items.length, status: checklist.status }, null, 2));
}

main();
