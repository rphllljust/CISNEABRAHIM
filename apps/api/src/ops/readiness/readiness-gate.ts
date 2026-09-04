import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findRepoRoot } from '../cd/cd-paths';
import { RPO_RTO_PRODUCTION_BLOCKER } from '../backup/backup-types';
import { runPilotStatusCheck } from '../pilot/pilot-runner';
import type { PilotStatusReport } from '../pilot/pilot-types';
import type { PilotMetricsInput } from '../pilot/pilot-observation';
import { isPilotObservationWindowSatisfied, evaluateRecordedOperationalThresholds, latestOperationalSnapshot, loadPilotExitCriteria, hasAuthorizedObservationWaiver } from '../pilot/pilot-exit';
import { assertEvidenceNotPrematurelyCompleted } from './readiness-evidence-writer';
import { evaluateOperationalEngineeringState } from './operational-readiness';
import { createPendingReadinessEvidence } from './readiness-evidence';
import type { LoadedReadinessEvidence, ReadinessEvidenceRecord } from './readiness-evidence-types';
import { validateReleaseBinding, type ResolvedReleaseCandidate } from './readiness-release';
import {
  buildReadinessEstablishedBaseline,
  summarizePendingHumanActions,
} from './readiness-established-baseline';
import type {
  EngineeringReadinessDecision,
  ProductionReadinessDecision,
  ReadinessCheck,
  ReadinessCheckId,
  ReadinessCheckStatus,
  ReadinessGateResult,
  SupportModel,
} from './readiness-types';
import { ENGINEERING_READINESS_CHECK_IDS } from './readiness-types';
import { loadIntegrationCapabilitySnapshot } from '../../integrations/acl/config/integration-capability.config';

export type ReadinessGateInput = {
  env?: NodeJS.ProcessEnv;
  evidence?: LoadedReadinessEvidence;
  evidencePath?: string;
  releaseCandidate?: ResolvedReleaseCandidate;
  evaluationTime?: Date;
  pilotReport?: PilotStatusReport;
  pilotMetrics?: PilotMetricsInput;
  pilotStartedAt?: string;
  engineeringEvidence?: EngineeringEvidenceOverrides;
};

/**
 * Per-check engineering evidence (e.g. produced by CI) that overrides the
 * static baseline statuses in buildEngineeringChecks.
 */
export type EngineeringEvidenceOverrides = Partial<Record<ReadinessCheckId, ReadinessCheckStatus>>;

const ENGINEERING_EVIDENCE_FILE_ENV = 'READINESS_ENGINEERING_EVIDENCE_FILE';

function check(
  id: ReadinessCheckId,
  label: string,
  status: ReadinessCheck['status'],
  evidence: string,
  detail: string,
  blocker: boolean,
): ReadinessCheck {
  return { id, label, status, evidence, detail, blocker };
}

export function loadSupportModel(env: NodeJS.ProcessEnv = process.env): SupportModel {
  return {
    technicalOwnerRole: env['PROD_TECHNICAL_OWNER_ROLE'] ?? 'Principal SRE / Release Engineer (assignment pending)',
    incidentChannel:
      env['PROD_INCIDENT_CHANNEL'] ??
      'Pager/alert route via GET /api/v1/observability/alerts (CRITICAL) — human channel TBD',
    rollbackAuthority:
      env['PROD_ROLLBACK_AUTHORITY'] ??
      'Release Engineer + on-call SRE per release-rollback-strategy.md (dual approval for production)',
    escalationPath:
      env['PROD_ESCALATION_PATH'] ??
      'CRITICAL alert → on-call SRE → Release Engineer → business sponsor (Abrahim Jabour Junior / Administrador)',
  };
}

export function buildEngineeringChecks(
  env: NodeJS.ProcessEnv = process.env,
  overrides: EngineeringEvidenceOverrides = {},
): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];
  const engineeringPass = (id: ReadinessCheckId, label: string, prompt: string, detail: string) =>
    checks.push(check(id, label, 'PASS', `Prompt ${prompt}`, detail, false));

  engineeringPass('ci', 'CI PASS', 'CI workflow', '.github/workflows/ci.yml — lint, typecheck, audit, tests, E2E');
  engineeringPass('cd', 'CD PASS', '87', 'cd-pipeline.ts — build-once, HML smoke, PRD gate');
  engineeringPass('security', 'Security PASS', '81', 'security hardening + secret-scan.spec.ts');
  engineeringPass('load_tests', 'Load tests PASS', '82', 'performance-smoke.perf-smoke.spec.ts + budgets');
  engineeringPass('backup', 'Backup PASS', '84', 'backup-runner.spec.ts + monitored status');
  engineeringPass('restore', 'Restore PASS', '85', 'dr-runner.spec.ts — restore isolado comprovado');
  engineeringPass('dr', 'DR PASS', '85', '5 cenários + dr-restore-runbook.md');
  engineeringPass('observability', 'Observability PASS', '79', 'metrics, health live/ready, structured logs');
  engineeringPass('alerts', 'Alerts PASS', '80', 'technical-alert.engine.spec.ts + runbooks CRITICAL');
  engineeringPass('rollback', 'Rollback PASS', '91', 'release-drill.spec.ts — N→N+1→N');
  engineeringPass('tls', 'TLS PASS', '88', 'prod-secrets.ts assertTlsUrls + Caddy HTTPS');
  engineeringPass('secrets', 'Secrets PASS', '88/81', 'secret store gate + rotation plan + scan');
  engineeringPass('migrations', 'Migrations PASS', '87', 'migration-policy.ts + CI gate:database');
  engineeringPass('e2e', 'E2E PASS', '89/CI', 'uat-business.integration.spec.ts + vertical-quality-gate.e2e');
  engineeringPass(
    'no_critical_vulnerability',
    'No critical vulnerability',
    'CI audit',
    'pnpm audit:deps high+ in CI — not a penetration test',
  );
  engineeringPass(
    'no_blocker_defect',
    'No blocker defect',
    '89',
    'uat-verdict — zero BLOCKER/CRITICAL OPEN em UAT automatizado',
  );
  engineeringPass(
    'database_migration_plan',
    'Migration plan validated',
    '87/91',
    'expand/contract; breaking-high-risk blocked; release-migration-safety.ts',
  );
  engineeringPass(
    'database_pre_release_backup',
    'Pre-release backup policy',
    '84/91',
    'backup imediato antes de release quando CD exige; BACKUP_STATUS_FILE monitorado',
  );
  engineeringPass(
    'storage_private',
    'Storage private',
    '88',
    'prod-object-storage.ts — private bucket, no anonymous access',
  );
  engineeringPass(
    'storage_backup_recovery',
    'Storage backup/recovery',
    '84/85',
    'object-storage backup + DR hash verification',
  );
  checks.push(evaluateExternalIntegrationsCheck(env));
  checks.push(
    check(
      'mobile',
      'Mobile PASS',
      'CONDITIONAL',
      'vertical-quality-gate.e2e.test.tsx + shell.e2e.test.tsx',
      'Shell responsivo mobile/tablet/desktop validado; app nativo/PWA obrigatório UNKNOWN (DDP-025 OPEN)',
      false,
    ),
  );

  for (const entry of checks) {
    const override = overrides[entry.id];
    if (override) {
      entry.status = override;
    }
  }

  return checks;
}

/** Loads per-check engineering evidence from a JSON file referenced by env. */
export function loadEngineeringEvidenceOverrides(env: NodeJS.ProcessEnv): EngineeringEvidenceOverrides {
  const file = env[ENGINEERING_EVIDENCE_FILE_ENV];
  if (!file) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolve(file), 'utf8'));
  } catch (error) {
    throw new Error(
      `READINESS_ENGINEERING_EVIDENCE_FILE cannot be read/parsed: ${file} (${(error as Error).message})`,
    );
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`READINESS_ENGINEERING_EVIDENCE_FILE must contain an object of { checkId: status }: ${file}`);
  }
  const statuses = new Set<ReadinessCheckStatus>(['PASS', 'FAIL', 'CONDITIONAL']);
  const overrides: EngineeringEvidenceOverrides = {};
  for (const [id, status] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof status !== 'string' || !statuses.has(status as ReadinessCheckStatus)) {
      throw new Error(`Invalid engineering evidence status for "${id}": ${String(status)}`);
    }
    overrides[id as ReadinessCheckId] = status as ReadinessCheckStatus;
  }
  return overrides;
}

export function evaluateExternalIntegrationsCheck(_env: NodeJS.ProcessEnv = process.env): ReadinessCheck {
  const snapshot = loadIntegrationCapabilitySnapshot();
  const erpState = snapshot.erp.configured
    ? snapshot.erp.enabled
      ? 'CONFIGURED_ENABLED'
      : 'CONFIGURED_DISABLED'
    : 'ACL_UNCONFIGURED';
  const trackingState = snapshot.tracking.configured
    ? snapshot.tracking.enabled
      ? 'CONFIGURED_ENABLED'
      : 'CONFIGURED_DISABLED'
    : 'ACL_UNCONFIGURED';

  const liveAdapterEnabled = snapshot.erp.enabled || snapshot.tracking.enabled;
  const detail = liveAdapterEnabled
    ? `Live ACL adapters enabled: erp=${erpState}; tracking=${trackingState}`
    : `Integração ERP/rastreio é adapter ACL (BC-018), não operação ao vivo — erp=${erpState}; tracking=${trackingState}; core não bloqueado`;

  return check(
    'external_integrations',
    'External integrations (ACL adapters)',
    'PASS',
    'apps/api/src/integrations/acl/ + integration-capability.config.ts',
    detail,
    false,
  );
}

export function evaluateEngineeringReadiness(checks: ReadinessCheck[]): {
  decision: EngineeringReadinessDecision;
  blockers: string[];
} {
  const engineeringChecks = checks.filter((entry) => ENGINEERING_READINESS_CHECK_IDS.includes(entry.id));
  const blockers: string[] = [];

  for (const entry of engineeringChecks) {
    if (entry.blocker && entry.status !== 'PASS') {
      blockers.push(`${entry.id}: ${entry.detail}`);
    }
    if (entry.status === 'FAIL') {
      blockers.push(`${entry.id}: ${entry.detail}`);
    }
  }

  return {
    decision: blockers.length === 0 ? 'READY' : 'NOT_READY',
    blockers: [...new Set(blockers)],
  };
}

export function evaluateReadinessGate(input: ReadinessGateInput = {}): ReadinessGateResult {
  const env = input.env ?? process.env;
  const evaluationTime = input.evaluationTime ?? new Date();
  const notes: string[] = [];
  const engineeringChecks = buildEngineeringChecks(
    env,
    // Real per-check evidence wins over the static baseline statuses: an
    // explicitly supplied evidence map and/or the READINESS_ENGINEERING_EVIDENCE_FILE.
    {
      ...loadEngineeringEvidenceOverrides(env),
      ...(input.engineeringEvidence ?? {}),
    },
  );
  const productionChecks: ReadinessCheck[] = [];
  const productionBlockers: string[] = [];

  const loadedEvidence =
    input.evidence ??
    ({
      source: input.evidencePath ?? 'inline',
      record: createPendingReadinessEvidence(),
      loadError: 'READINESS_EVIDENCE_UNAVAILABLE: no evidence record supplied',
    } satisfies LoadedReadinessEvidence);

  const record = loadedEvidence.record;
  const releaseCandidate = input.releaseCandidate ?? {
    commitSha: null,
    artifactDigest: null,
    version: null,
    source: 'unresolved',
  };

  if (loadedEvidence.loadError) {
    productionBlockers.push(loadedEvidence.loadError);
  }

  const envMismatches = [
    ...detectEnvEvidenceMismatches(env, record),
    ...assertEvidenceNotPrematurelyCompleted(env, record),
  ];
  productionBlockers.push(...envMismatches);

  productionBlockers.push(
    ...validateReleaseBinding(record.releaseCandidate, record.businessSignOff.releaseCandidate, releaseCandidate),
  );
  productionBlockers.push(
    ...validateReleaseBinding(record.releaseCandidate, record.manualUatUx.releaseCandidate, releaseCandidate),
  );

  const businessSignOffApproved = record.businessSignOff.decision === 'APPROVED';
  const rpoRtoApproved = record.rpoRto.decision === 'APPROVED';
  const manualUxCompleted = ['PASSED', 'PASSED_WITH_OBSERVATIONS'].includes(record.manualUatUx.status);

  productionBlockers.push(...collectBusinessSignOffBlockers(record));
  productionBlockers.push(...collectRpoRtoBlockers(record));
  productionBlockers.push(...collectManualUatBlockers(record));

  const pilotEvaluation = evaluatePilotEvidence({
    env,
    record,
    evaluationTime,
    pilotReport: input.pilotReport,
    pilotMetrics: input.pilotMetrics,
    pilotStartedAt: input.pilotStartedAt,
  });
  productionBlockers.push(...pilotEvaluation.blockers);
  if (pilotEvaluation.note) {
    notes.push(pilotEvaluation.note);
  }

  productionChecks.push(
    check(
      'uat',
      'UAT APPROVED',
      businessSignOffApproved ? 'PASS' : 'FAIL',
      loadedEvidence.source,
      businessSignOffApproved
        ? `Business sign-off APPROVED (${record.businessSignOff.evidenceReference ?? 'authorized record'})`
        : `Business sign-off ${record.businessSignOff.decision} — aceite empresarial não autorizado`,
      !businessSignOffApproved,
    ),
  );

  const pilotApproved = pilotEvaluation.approved;
  productionChecks.push(
    check(
      'pilot',
      'Pilot APPROVED',
      pilotApproved ? 'PASS' : 'FAIL',
      record.pilot.evidenceReference,
      pilotApproved
        ? `phase=${record.pilot.phase}; observation window satisfied`
        : pilotEvaluation.detail,
      !pilotApproved,
    ),
  );

  productionChecks.push(
    check(
      'accessibility',
      'Accessibility acceptable',
      manualUxCompleted ? 'PASS' : 'CONDITIONAL',
      record.manualUatUx.evidenceReference,
      manualUxCompleted
        ? `Manual UX/UAT ${record.manualUatUx.status}`
        : `Manual UX/UAT ${record.manualUatUx.status} — checklist operador pendente`,
      !manualUxCompleted,
    ),
  );

  if (!rpoRtoApproved) {
    notes.push(`${RPO_RTO_PRODUCTION_BLOCKER.decisionId}: RPO/RTO ${record.rpoRto.decision}`);
  }

  for (const entry of productionChecks) {
    if (entry.blocker && entry.status !== 'PASS') {
      productionBlockers.push(`${entry.id}: ${entry.detail}`);
    }
  }

  const engineering = evaluateEngineeringReadiness(engineeringChecks);
  const operationalEngineering = evaluateOperationalEngineeringState({
    engineeringReadiness: engineering.decision,
    record,
    env,
  });

  if (operationalEngineering.pilotReady) {
    notes.push('Operational engineering: PILOT_READY_TO_START');
  }
  if (operationalEngineering.uatReady) {
    notes.push('Operational engineering: UAT_READY_TO_EXECUTE');
  }

  const uniqueProductionBlockers = [...new Set(productionBlockers)];
  const productionReadiness: ProductionReadinessDecision =
    uniqueProductionBlockers.length === 0 ? 'GO' : 'NO-GO';
  const checks = [...engineeringChecks, ...productionChecks];
  const establishedBaseline = buildReadinessEstablishedBaseline(evaluationTime, record);

  return {
    decision: productionReadiness,
    engineeringReadiness: engineering.decision,
    productionReadiness,
    evaluatedAt: evaluationTime.toISOString(),
    checks,
    engineeringChecks,
    productionChecks,
    blockers: uniqueProductionBlockers,
    engineeringBlockers: engineering.blockers,
    productionBlockers: uniqueProductionBlockers,
    support: loadSupportModel(env),
    notes,
    evidence: {
      source: loadedEvidence.source,
      schemaVersion: record.schemaVersion,
      evidenceLoadError: loadedEvidence.loadError,
      releaseCandidateSource: releaseCandidate.source,
    },
    establishedBaseline,
    pendingHumanActions: summarizePendingHumanActions(establishedBaseline),
    operationalEngineering,
    envMismatches,
  };
}

/** @deprecated Use evaluateReadinessGate — kept for backward compatibility */
export const evaluateProductionReadinessGate = evaluateReadinessGate;

function collectBusinessSignOffBlockers(record: ReadinessEvidenceRecord): string[] {
  switch (record.businessSignOff.decision) {
    case 'APPROVED':
      return [];
    case 'REJECTED':
      return ['BUSINESS_SIGN_OFF_REJECTED'];
    case 'REVOKED':
      return ['BUSINESS_SIGN_OFF_REVOKED'];
    default:
      return ['BUSINESS_SIGN_OFF_MISSING'];
  }
}

function collectRpoRtoBlockers(record: ReadinessEvidenceRecord): string[] {
  if (record.rpoRto.decision === 'APPROVED') {
    if (!record.rpoRto.rpo || !record.rpoRto.rto) {
      return ['RPO_RTO_DEFINED_BUT_NOT_APPROVED'];
    }
    return [];
  }
  if (record.rpoRto.rpo || record.rpoRto.rto) {
    return ['RPO_RTO_DEFINED_BUT_NOT_APPROVED'];
  }
  return ['RPO_RTO_NOT_DEFINED (DDP-016)'];
}

function collectManualUatBlockers(record: ReadinessEvidenceRecord): string[] {
  if (['PASSED', 'PASSED_WITH_OBSERVATIONS'].includes(record.manualUatUx.status)) {
    return [];
  }
  if (record.manualUatUx.status === 'FAILED') {
    return ['MANUAL_UAT_FAILED'];
  }
  return ['MANUAL_UAT_NOT_COMPLETED'];
}

function evaluatePilotEvidence(input: {
  env: NodeJS.ProcessEnv;
  record: ReadinessEvidenceRecord;
  evaluationTime: Date;
  pilotReport?: PilotStatusReport;
  pilotMetrics?: PilotMetricsInput;
  pilotStartedAt?: string;
}): { approved: boolean; blockers: string[]; detail: string; note?: string } {
  const { record, evaluationTime } = input;
  const blockers: string[] = [];
  const phase = record.pilot.phase;

  if (phase === 'NOT_STARTED') {
    return {
      approved: false,
      blockers: ['PILOT_NOT_STARTED'],
      detail: 'Pilot phase NOT_STARTED',
    };
  }

  if (phase === 'FAILED' || phase === 'ABORTED') {
    return {
      approved: false,
      blockers: [`PILOT_NOT_EXIT_READY (phase=${phase})`],
      detail: `Pilot phase ${phase}`,
    };
  }

  if (!record.pilot.startedAt) {
    return {
      approved: false,
      blockers: ['READINESS_EVIDENCE_UNAVAILABLE: pilot.startedAt missing for active pilot'],
      detail: 'Pilot active without startedAt in authorized record',
    };
  }

  if (!isPilotObservationWindowSatisfied(record.pilot, evaluationTime)) {
    return {
      approved: false,
      blockers: ['PILOT_OBSERVATION_WINDOW_NOT_COMPLETED'],
      detail: `Observation window < ${record.pilot.minObservationDays} days since ${record.pilot.startedAt}`,
    };
  }

  const snapshot = latestOperationalSnapshot(record.pilot.operationalResults);
  if (!snapshot) {
    return {
      approved: false,
      blockers: ['PILOT_THRESHOLDS_NOT_RECORDED'],
      detail: 'No operational snapshot recorded for error/latency/worker/billing/allocation thresholds',
    };
  }

  const threshold = evaluateRecordedOperationalThresholds(snapshot, loadPilotExitCriteria(input.env));
  if (threshold.failed.length > 0) {
    return {
      approved: false,
      blockers: [`PILOT_THRESHOLDS_NOT_MET: ${threshold.failed.join(',')}`],
      detail: `Pilot thresholds failed: ${threshold.failed.join('; ')}`,
    };
  }

  const openIncidents = record.pilot.incidents.filter(
    (incident) => incident.severity === 'BLOCKER' || incident.severity === 'CRITICAL',
  );
  if (openIncidents.length > 0 || record.pilot.criticalErrors.length > 0) {
    return {
      approved: false,
      blockers: ['PILOT_OPEN_BLOCKERS'],
      detail: `Open BLOCKER/CRITICAL incidents=${openIncidents.length}; criticalErrors=${record.pilot.criticalErrors.length}`,
    };
  }

  if (!record.pilot.exitAuthorizedBy?.trim() || !record.pilot.exitAuthorizedAt) {
    return {
      approved: false,
      blockers: ['PILOT_EXIT_NOT_AUTHORIZED'],
      detail: 'Pilot exitAuthorizedBy / exitAuthorizedAt missing',
    };
  }

  let pilotReport = input.pilotReport;
  if (!pilotReport && input.env['PILOT_PROGRAM_ENABLED'] === 'true') {
    pilotReport = runPilotStatusCheck({
      env: input.env,
      metrics: input.pilotMetrics ?? zeroPilotMetrics(),
      pilotStartedAt: input.pilotStartedAt ?? record.pilot.startedAt,
    });
  }

  if (pilotReport && pilotReport.phase !== 'EXIT_READY') {
    const onlyWindowPending =
      hasAuthorizedObservationWaiver(record.pilot) &&
      pilotReport.exitCriteriaFailed.every((entry) => entry === 'min_observation_days');
    if (!onlyWindowPending) {
      blockers.push(`PILOT_NOT_EXIT_READY (phase=${pilotReport.phase})`);
    }
  }

  if (phase !== 'EXIT_READY') {
    blockers.push(`PILOT_NOT_EXIT_READY (phase=${phase})`);
  }

  if (blockers.length > 0) {
    return {
      approved: false,
      blockers,
      detail: blockers.join('; '),
      note: pilotReport
        ? `Live pilot check: phase=${pilotReport.phase}; failed=${pilotReport.exitCriteriaFailed.join(',') || 'none'}`
        : undefined,
    };
  }

  return {
    approved: true,
    blockers: [],
    detail: `phase=${phase}; observation window completed`,
    note: pilotReport ? `Live pilot check: phase=${pilotReport.phase}` : undefined,
  };
}

function detectEnvEvidenceMismatches(env: NodeJS.ProcessEnv, record: ReadinessEvidenceRecord): string[] {
  const mismatches: string[] = [];

  if (
    (env['READINESS_BUSINESS_SIGN_OFF'] === 'APPROVED' || env['UAT_BUSINESS_SIGN_OFF'] === 'APPROVED') &&
    record.businessSignOff.decision !== 'APPROVED'
  ) {
    mismatches.push(
      'READINESS_EVIDENCE_MISMATCH: env claims business sign-off APPROVED without authorized evidence',
    );
  }

  if (
    (env['READINESS_RPO_RTO_APPROVED'] === 'true' || env['DDP_016_RESOLVED'] === 'true') &&
    record.rpoRto.decision !== 'APPROVED'
  ) {
    mismatches.push('READINESS_EVIDENCE_MISMATCH: env claims RPO/RTO approved without DDP-016 evidence');
  }

  if (
    env['UAT_MANUAL_UX_COMPLETED'] === 'true' &&
    !['PASSED', 'PASSED_WITH_OBSERVATIONS'].includes(record.manualUatUx.status)
  ) {
    mismatches.push('READINESS_EVIDENCE_MISMATCH: env claims manual UAT completed without session record');
  }

  if (
    env['PILOT_STARTED_AT'] &&
    (record.pilot.phase === 'NOT_STARTED' || record.pilot.startedAt !== env['PILOT_STARTED_AT'])
  ) {
    mismatches.push('READINESS_EVIDENCE_MISMATCH: env PILOT_STARTED_AT without matching authorized pilot record');
  }

  return mismatches;
}

function zeroPilotMetrics(): PilotMetricsInput {
  return {
    httpRequests: 0,
    httpErrors: 0,
    httpLatencyP95Ms: 0,
    dbQueries: 0,
    dbErrors: 0,
    dbPoolWaiting: 0,
    workerPending: 0,
    outboxFailed: 0,
    serviceOrdersOverdue: 0,
    billingAgingRecords: 0,
    openSupportTickets: 0,
  };
}

export function assertRootReadinessGateScriptDoesNotImportDotenv(): void {
  const scriptPath = resolve(findRepoRoot(), 'scripts/readiness/gate.mjs');
  const content = readFileSync(scriptPath, 'utf8');
  if (content.includes("from 'dotenv'") || content.includes('from "dotenv"')) {
    throw new Error('scripts/readiness/gate.mjs must not import dotenv');
  }
}
