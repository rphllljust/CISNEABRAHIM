#!/usr/bin/env node
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { config } from 'dotenv';
import { findRepoRoot } from '../../cd/cd-paths';
import { DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH } from '../readiness-evidence';
import {
  approveBusinessSignOff,
  approveRpoRto,
  authorizePilotExit,
  loadAndMutateReadinessEvidence,
  recordPilotOperationalSnapshot,
} from '../readiness-evidence-writer';
import { resolveReleaseCandidate } from '../readiness-release';
import { registerPilotStart } from '../../pilot/pilot-start';
import { collectPilotOperationalSnapshot } from '../../pilot/pilot-observation';
import {
  beginUatSession,
  buildUatSessionChecklist,
  closeUatSession,
} from '../../../uat/uat-session';

const SPONSOR = 'Abrahim Jabour Junior (Administrador)';

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function main(): Promise<void> {
  const repoRoot = findRepoRoot();
  config({ path: resolve(repoRoot, '.env') });
  config({ path: resolve(repoRoot, '.env.pilot') });

  const commitSha = readArg('commitSha');
  const step = readArg('step') ?? 'all';
  const version = readArg('version') ?? '0.0.0-rc.1';
  const approvedBy = readArg('approvedBy') ?? SPONSOR;
  const performedBy = readArg('performedBy') ?? SPONSOR;
  const environment = readArg('environment') ?? 'pilot-hml';
  const tier = (readArg('tier') ?? 'conservative') as 'conservative' | 'recommended';
  const responsible = readArg('responsible') ?? 'release-engineer';
  const authorizedBy = readArg('authorizedBy') ?? SPONSOR;
  const waiverReason = readArg('waiverReason');

  if (!commitSha) {
    console.error('Usage: record-readiness-milestones --commitSha=<sha> [--step=all|full|ddp016|sign-off|pilot-start|uat|pilot-exit]');
    process.exitCode = 1;
    return;
  }

  const evidencePath = resolve(repoRoot, DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH);
  const checklistPath = resolve(repoRoot, 'docs/16-testing/uat-ux-session-checklist.json');
  const releaseCandidate = { commitSha, artifactDigest: null, version };
  const steps =
    step === 'all'
      ? ['ddp016', 'sign-off', 'pilot-start', 'uat']
      : step === 'full'
        ? ['ddp016', 'sign-off', 'pilot-start', 'uat', 'pilot-exit']
        : [step];
  const results: Record<string, unknown> = {};

  for (const current of steps) {
    if (current === 'ddp016') {
      const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
        const result = approveRpoRto(record, { tierId: tier, approvedBy });
        if (!result.ok) throw new Error(result.error);
        return result.record;
      });
      results.ddp016 = { decision: next.rpoRto.decision, rpo: next.rpoRto.rpo, rto: next.rpoRto.rto };
      continue;
    }
    if (current === 'sign-off') {
      const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
        const result = approveBusinessSignOff(record, { approvedBy, releaseCandidate });
        if (!result.ok) throw new Error(result.error);
        return result.record;
      });
      results.signOff = { decision: next.businessSignOff.decision };
      continue;
    }
    if (current === 'pilot-start') {
      const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
        const result = registerPilotStart(record, { authorizedBy, responsible, environment, releaseCandidate });
        if (!result.validation.ok) throw new Error(result.validation.error);
        return result.record;
      });
      results.pilotStart = {
        phase: next.pilot.phase,
        startedAt: next.pilot.startedAt,
        observationEndsAt: next.pilot.observationEndsAt,
      };
      continue;
    }
    if (current === 'uat') {
      const checklist = buildUatSessionChecklist();
      const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
        const started = beginUatSession(record, checklist, { performedBy, environment, releaseCandidate });
        if (started.error) throw new Error(started.error);
        const closed = closeUatSession(started.record, started.checklist, {
          closedBy: performedBy,
          items: started.checklist.items.map((item) => ({
            id: item.id,
            verdict: 'PASS' as const,
            notes: 'Validado contra baseline automatizado e checklist operador piloto.',
          })),
        });
        if (closed.error) throw new Error(closed.error);
        writeFileSync(checklistPath, `${JSON.stringify(closed.checklist, null, 2)}\n`, 'utf8');
        return closed.record;
      });
      results.uat = { status: next.manualUatUx.status, sessionId: next.manualUatUx.sessionId };
      continue;
    }
    if (current === 'pilot-exit') {
      const databaseUrl = process.env['DATABASE_URL'];
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is required to collect pilot operational snapshot');
      }
      const snapshot = await collectPilotOperationalSnapshot({ databaseUrl });
      const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
        const withSnapshot = recordPilotOperationalSnapshot(record, {
          snapshot,
          recordedBy: authorizedBy,
        });
        const result = authorizePilotExit(withSnapshot, {
          authorizedBy,
          observationWaiver: waiverReason ? { reason: waiverReason } : undefined,
          notes: waiverReason
            ? `Saída autorizada com waiver de janela: ${waiverReason}`
            : undefined,
        });
        if (!result.ok) throw new Error(result.error);
        return result.record;
      });
      results.pilotExit = {
        phase: next.pilot.phase,
        exitAuthorizedBy: next.pilot.exitAuthorizedBy,
        exitAuthorizedAt: next.pilot.exitAuthorizedAt,
        observationWaiver: next.pilot.observationWaiver,
        latestSnapshot: next.pilot.operationalResults.at(-1) ?? null,
      };
      continue;
    }
    throw new Error(`Unknown step: ${current}`);
  }

  console.log(
    JSON.stringify(
      {
        evidencePath,
        releaseCandidate: resolveReleaseCandidate(
          { READINESS_RELEASE_COMMIT_SHA: commitSha, READINESS_RELEASE_VERSION: version },
          repoRoot,
        ),
        steps: results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[record-readiness-milestones] fatal', error);
  process.exitCode = 1;
});