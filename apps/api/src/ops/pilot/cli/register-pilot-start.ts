#!/usr/bin/env node
import { resolve } from 'node:path';
import { findRepoRoot } from '../../cd/cd-paths';
import { DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH } from '../../readiness/readiness-evidence';
import { loadAndMutateReadinessEvidence } from '../../readiness/readiness-evidence-writer';
import { registerPilotStart } from '../pilot-start';

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function main(): Promise<void> {
  const authorizedBy = readArg('authorizedBy');
  const responsible = readArg('responsible');
  const environment = readArg('environment');
  const version = readArg('version');
  const commitSha = readArg('commitSha');

  if (!authorizedBy || !responsible || !environment || (!version && !commitSha)) {
    console.error(
      'Usage: register-pilot-start --authorizedBy=... --responsible=... --environment=... --version=... [--commitSha=...]',
    );
    process.exitCode = 1;
    return;
  }

  const evidencePath = resolve(findRepoRoot(), DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH);
  const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
    const result = registerPilotStart(record, {
      authorizedBy,
      responsible,
      environment,
      releaseCandidate: {
        commitSha: commitSha ?? null,
        artifactDigest: null,
        version: version ?? null,
      },
    });
    if (!result.validation.ok) {
      throw new Error(result.validation.error);
    }
    return result.record;
  });

  console.log(
    JSON.stringify(
      {
        phase: next.pilot.phase,
        startedAt: next.pilot.startedAt,
        observationEndsAt: next.pilot.observationEndsAt,
        engineeringReadiness: next.pilot.engineeringReadiness,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[pilot-start] fatal', error);
  process.exitCode = 1;
});
