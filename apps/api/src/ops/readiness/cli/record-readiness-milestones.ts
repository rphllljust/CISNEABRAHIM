#!/usr/bin/env node
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { config } from 'dotenv';
import { findRepoRoot } from '../../cd/cd-paths';
import { DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH, loadReadinessEvidence } from '../readiness-evidence';
import {
  approveBusinessSignOff,
  approveRpoRto,
  authorizePilotExit,
  loadAndMutateReadinessEvidence,
  recordPilotOperationalSnapshot,
} from '../readiness-evidence-writer';
import { resolveReleaseCandidate } from '../readiness-release';
import type { ReleaseCandidateRef } from '../readiness-evidence-types';
import { registerPilotStart } from '../../pilot/pilot-start';
import {
  collectPilotExitReadinessSnapshot,
  collectPilotOperationalSnapshot,
  resolvePilotSnapshotDatabaseUrl,
} from '../../pilot/pilot-observation';
import { countOpenPilotBlockers } from '../../pilot/pilot-exit';
import {
  beginUatSession,
  buildUatSessionChecklist,
  closeUatSession,
} from '../../../uat/uat-session';

const SPONSOR = 'Abrahim Jabour Junior (Administrador)';

const UAT_VERDICT_VALUES = new Set(['PASS', 'FAIL', 'BLOCKER', 'OBSERVATION']);

type UatVerdictEntry = {
  id: string;
  verdict: 'PASS' | 'FAIL' | 'BLOCKER' | 'OBSERVATION';
  notes?: string;
};

/**
 * Resolves the operator-checklist verdicts used to close a UAT session.
 * Fail-closed by design: the CLI never fabricates PASS verdicts on its own.
 * Verdicts must come from (1) an operator-recorded verdicts file, or (2) an
 * explicit --uatAutoPassBy=<identity> authorization for an auto-pass.
 */
function resolveUatVerdicts(
  checklist: { items: Array<{ id: string }>; sessionId?: string | null },
  options: { verdictsFile?: string; autoPassBy?: string; closedBy: string },
): Array<{ id: string; verdict: 'PASS' | 'FAIL' | 'BLOCKER' | 'OBSERVATION'; notes: string | null }> {
  if (options.verdictsFile) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(options.verdictsFile, 'utf8'));
    } catch {
      throw new Error(`Cannot read UAT verdicts file: ${options.verdictsFile}`);
    }
    if (!Array.isArray(parsed)) {
      throw new Error('UAT verdicts file must contain an array of { id, verdict, notes? } entries.');
    }
    const byId = new Map<string, UatVerdictEntry>();
    for (const entry of parsed) {
      const row = entry as { id?: unknown; verdict?: unknown; notes?: unknown };
      if (
        typeof row.id !== 'string' ||
        typeof row.verdict !== 'string' ||
        !UAT_VERDICT_VALUES.has(row.verdict)
      ) {
        throw new Error(`Invalid UAT verdict entry (must be { id, verdict: PASS|FAIL|BLOCKER|OBSERVATION }): ${JSON.stringify(entry)}`);
      }
      byId.set(row.id, {
        id: row.id,
        verdict: row.verdict as UatVerdictEntry['verdict'],
        notes: typeof row.notes === 'string' ? row.notes : undefined,
      });
    }
    const missing = checklist.items.filter((item) => !byId.has(item.id)).map((item) => item.id);
    if (missing.length > 0) {
      throw new Error(`UAT verdicts file is missing verdicts for items: ${missing.join(', ')}`);
    }
    const unknown = [...byId.keys()].filter((id) => !checklist.items.some((item) => item.id === id));
    if (unknown.length > 0) {
      throw new Error(`UAT verdicts file contains items not in the checklist: ${unknown.join(', ')}`);
    }
    return checklist.items.map((item) => {
      const entry = byId.get(item.id)!;
      return { id: item.id, verdict: entry.verdict, notes: entry.notes ?? null };
    });
  }

  if (options.autoPassBy?.trim()) {
    const authorizer = options.autoPassBy.trim();
    const session = checklist.sessionId ? ` (sessão ${checklist.sessionId})` : '';
    const notes = `Auto-pass explicitamente autorizado por ${authorizer}${session}, fechado por ${options.closedBy}.`;
    return checklist.items.map((item) => ({ id: item.id, verdict: 'PASS' as const, notes }));
  }

  throw new Error(
    'uat step requires an explicit verdict source: pass --uatVerdictsFile=<operator-checklist.json> ' +
      'or --uatAutoPassBy=<authorized-identity>. Refusing to auto-fabricate PASS for operator checklist items.',
  );
}

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
  const recordedBy = readArg('recordedBy') ?? 'release-engineer';
  const waiverReason = readArg('waiverReason');
  const uatVerdictsFile = readArg('uatVerdictsFile');
  const uatAutoPassBy = readArg('uatAutoPassBy');

  if (!commitSha && step !== 'pilot-snapshot') {
    console.error(
      'Usage: record-readiness-milestones --commitSha=<sha> [--step=all|full|ddp016|sign-off|pilot-start|uat|pilot-snapshot|pilot-exit]\n' +
        '  uat step: pass --uatVerdictsFile=<path-to-checklist-json> (operator-recorded verdicts) OR\n' +
        '            --uatAutoPassBy=<authorized-identity> to record an explicit authorized auto-pass.',
    );
    process.exitCode = 1;
    return;
  }

  const evidencePath = resolve(repoRoot, DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH);
  const checklistPath = resolve(repoRoot, 'docs/16-testing/uat-ux-session-checklist.json');
  const releaseCandidate: ReleaseCandidateRef = {
    commitSha: commitSha ?? null,
    artifactDigest: null,
    version,
  };
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
        const items = resolveUatVerdicts(started.checklist, {
          verdictsFile: uatVerdictsFile,
          autoPassBy: uatAutoPassBy,
          closedBy: performedBy,
        });
        const closed = closeUatSession(started.record, started.checklist, {
          closedBy: performedBy,
          items,
        });
        if (closed.error) throw new Error(closed.error);
        writeFileSync(checklistPath, `${JSON.stringify(closed.checklist, null, 2)}\n`, 'utf8');
        return closed.record;
      });
      results.uat = { status: next.manualUatUx.status, sessionId: next.manualUatUx.sessionId };
      continue;
    }
    if (current === 'pilot-snapshot') {
      const databaseUrl = resolvePilotSnapshotDatabaseUrl();
      if (!databaseUrl) {
        throw new Error('PILOT_DATABASE_URL or HML/DATABASE_URL is required to collect pilot operational snapshot');
      }
      const currentEvidence = loadReadinessEvidence(evidencePath);
      if (currentEvidence.loadError) {
        throw new Error(currentEvidence.loadError);
      }
      const snapshot = await collectPilotExitReadinessSnapshot({
        databaseUrl,
        openIncidentBlockers: countOpenPilotBlockers(currentEvidence.record.pilot),
      });
      const next = loadAndMutateReadinessEvidence(evidencePath, (record) => {
        const before = {
          phase: record.pilot.phase,
          startedAt: record.pilot.startedAt,
          observationEndsAt: record.pilot.observationEndsAt,
          exitAuthorizedAt: record.pilot.exitAuthorizedAt,
          exitAuthorizedBy: record.pilot.exitAuthorizedBy,
          observationWaiver: record.pilot.observationWaiver,
        };
        const withSnapshot = recordPilotOperationalSnapshot(record, {
          snapshot,
          recordedBy,
        });
        if (
          withSnapshot.pilot.phase !== before.phase ||
          withSnapshot.pilot.startedAt !== before.startedAt ||
          withSnapshot.pilot.observationEndsAt !== before.observationEndsAt ||
          withSnapshot.pilot.exitAuthorizedAt !== before.exitAuthorizedAt ||
          withSnapshot.pilot.exitAuthorizedBy !== before.exitAuthorizedBy ||
          withSnapshot.pilot.observationWaiver !== before.observationWaiver
        ) {
          throw new Error('pilot-snapshot must not change phase, dates, exit authorization, or waiver');
        }
        return withSnapshot;
      });
      results.pilotSnapshot = {
        phase: next.pilot.phase,
        startedAt: next.pilot.startedAt,
        observationEndsAt: next.pilot.observationEndsAt,
        exitAuthorizedAt: next.pilot.exitAuthorizedAt,
        latestSnapshot: next.pilot.operationalResults.at(-1) ?? null,
      };
      continue;
    }
    if (current === 'pilot-exit') {
      // Collect from the pilot/HML environment (same resolver as pilot-snapshot)
      // so operational evidence is never gathered from an unintended database.
      const databaseUrl = resolvePilotSnapshotDatabaseUrl();
      if (!databaseUrl) {
        throw new Error('PILOT_DATABASE_URL or HML/DATABASE_URL is required to collect pilot operational snapshot');
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