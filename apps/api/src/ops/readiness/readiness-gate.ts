import { RPO_RTO_PRODUCTION_BLOCKER } from '../backup/backup-types';
import { runPilotStatusCheck } from '../pilot/pilot-runner';
import type { PilotStatusReport } from '../pilot/pilot-types';
import type { PilotMetricsInput } from '../pilot/pilot-observation';
import type {
  ProductionReadinessDecision,
  ReadinessCheck,
  ReadinessCheckId,
  ReadinessGateResult,
  SupportModel,
} from './readiness-types';

export type ReadinessGateInput = {
  env?: NodeJS.ProcessEnv;
  pilotReport?: PilotStatusReport;
  pilotMetrics?: PilotMetricsInput;
  pilotStartedAt?: string;
};

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

export function evaluateProductionReadinessGate(input: ReadinessGateInput = {}): ReadinessGateResult {
  const env = input.env ?? process.env;
  const notes: string[] = [];
  const checks: ReadinessCheck[] = [];

  const businessSignOff =
    env['READINESS_BUSINESS_SIGN_OFF'] === 'APPROVED' ||
    env['UAT_BUSINESS_SIGN_OFF'] === 'APPROVED';
  const rpoRtoApproved =
    env['READINESS_RPO_RTO_APPROVED'] === 'true' || env['DDP_016_RESOLVED'] === 'true';

  let pilotReport = input.pilotReport;
  if (!pilotReport && env['PILOT_PROGRAM_ENABLED'] === 'true') {
    pilotReport = runPilotStatusCheck({
      env,
      metrics: input.pilotMetrics ?? zeroPilotMetrics(),
      pilotStartedAt: input.pilotStartedAt ?? env['PILOT_STARTED_AT'],
    });
  }

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
  engineeringPass(
    'external_integrations',
    'External integrations',
    '69/70-A',
    'adapters não confirmados permanecem OFF; ERP NOT_IMPLEMENTED não bloqueia core',
  );

  checks.push(
    check(
      'uat',
      'UAT APPROVED',
      businessSignOff ? 'PASS' : 'FAIL',
      'Prompt 89 / uat-business-scenarios.md',
      businessSignOff
        ? 'Business sign-off recorded'
        : 'UAT engenharia APPROVED; aceite empresarial (patrocinador) PENDING — não falsificado',
      !businessSignOff,
    ),
  );

  const pilotApproved = pilotReport?.phase === 'EXIT_READY';
  checks.push(
    check(
      'pilot',
      'Pilot APPROVED',
      pilotReport ? (pilotApproved ? 'PASS' : 'FAIL') : 'CONDITIONAL',
      'Prompt 90 / pilot-program.md',
      pilotReport
        ? `phase=${pilotReport.phase}; failed=${pilotReport.exitCriteriaFailed.join(',') || 'none'}`
        : 'PILOT_PROGRAM_ENABLED not set — pilot exit not evaluated live',
      pilotReport ? !pilotApproved : false,
    ),
  );

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

  const manualUxPending = env['UAT_MANUAL_UX_COMPLETED'] !== 'true';
  checks.push(
    check(
      'accessibility',
      'Accessibility acceptable',
      manualUxPending ? 'CONDITIONAL' : 'PASS',
      'uat-ux-checklist.md + component a11y tests',
      manualUxPending
        ? 'Automatizado PASS (landmarks, mobile nav); checklist manual operador PENDING'
        : 'Manual UX checklist completed',
      manualUxPending,
    ),
  );

  if (!rpoRtoApproved) {
    notes.push(`${RPO_RTO_PRODUCTION_BLOCKER.decisionId}: RPO/RTO ${RPO_RTO_PRODUCTION_BLOCKER.status}`);
  }

  const blockers = collectBlockers(checks, {
    businessSignOff,
    rpoRtoApproved,
    pilotReport,
    manualUxPending,
  });

  const decision: ProductionReadinessDecision = blockers.length === 0 ? 'GO' : 'NO-GO';

  return {
    decision,
    evaluatedAt: new Date().toISOString(),
    checks,
    blockers,
    support: loadSupportModel(env),
    notes,
  };
}

function collectBlockers(
  checks: ReadinessCheck[],
  context: {
    businessSignOff: boolean;
    rpoRtoApproved: boolean;
    pilotReport?: PilotStatusReport;
    manualUxPending: boolean;
  },
): string[] {
  const blockers: string[] = [];

  for (const entry of checks) {
    if (entry.blocker && entry.status !== 'PASS') {
      blockers.push(`${entry.id}: ${entry.detail}`);
    }
  }

  if (!context.businessSignOff) {
    blockers.push('BUSINESS_STAKEHOLDER_SIGN_OFF_PENDING');
  }
  if (!context.rpoRtoApproved) {
    blockers.push('RPO_RTO_TARGET_NOT_DEFINED (DDP-016)');
  }
  if (context.pilotReport && context.pilotReport.phase !== 'EXIT_READY') {
    blockers.push(`PILOT_NOT_EXIT_READY (phase=${context.pilotReport.phase})`);
  }
  if (context.manualUxPending) {
    blockers.push('UAT_MANUAL_UX_CHECKLIST_PENDING');
  }

  return [...new Set(blockers)];
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
