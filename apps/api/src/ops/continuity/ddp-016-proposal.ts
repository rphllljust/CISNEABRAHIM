import type { BackupConfig } from '../backup/backup-config';
import { loadBackupConfig } from '../backup/backup-config';
import type { DrDrillResult, DrMetrics } from '../dr/dr-types';

export type ContinuityTierId = 'conservative' | 'recommended' | 'high_availability';

export type ContinuityAchievability = 'ACHIEVABLE_NOW' | 'REQUIRES_OPERATIONAL_CHANGE' | 'NOT_ACHIEVABLE_WITH_CURRENT_ARCHITECTURE';

export type ContinuityDuration = {
  hours: number;
  label: string;
  rationale: string;
};

export type ContinuityTierProposal = {
  id: ContinuityTierId;
  title: string;
  rpo: ContinuityDuration;
  rto: ContinuityDuration;
  achievability: ContinuityAchievability;
  dependencies: string[];
  costOrImpact: string;
  restoreProcedure: string;
  restoreTest: string;
};

export type ContinuityCapabilities = {
  backupMethod: 'pg_dump_fc_logical';
  walPitrEnabled: false;
  replicationEnabled: false;
  postgresBackupMode: BackupConfig['postgresBackupMode'];
  retentionDaily: number;
  offsiteConfigured: boolean;
  backupSchedulerConfigured: boolean;
  objectStorageBackupEnabled: boolean;
  drScenarios: string[];
  applicationRollbackWithoutDbPitr: true;
  rpoAchievable: ContinuityDuration;
  rtoAchievable: ContinuityDuration;
  measuredDr: {
    rpoMs: number | null;
    rtoMs: number | null;
    source: string | null;
  };
  limitations: string[];
};

export type Ddp016Proposal = {
  decisionId: 'DDP-016';
  status: 'READY_FOR_APPROVAL';
  evaluatedAt: string;
  capabilities: ContinuityCapabilities;
  tiers: ContinuityTierProposal[];
  recommendedTierId: ContinuityTierId;
  humanDecisionRequired: string;
  proposalReference: string;
  lastDrValidation: {
    status: 'PASS' | 'FAIL' | 'NOT_RUN';
    scenario: string | null;
    finishedAt: string | null;
    rtoMeasuredMs: number | null;
    checksPassed: number | null;
    checksTotal: number | null;
    source: string | null;
    notes: string | null;
  };
};

const MS_PER_HOUR = 60 * 60 * 1000;

function hours(ms: number): number {
  return Math.round((ms / MS_PER_HOUR) * 100) / 100;
}

function durationFromHours(value: number, rationale: string): ContinuityDuration {
  return {
    hours: value,
    label: value < 1 ? `${Math.round(value * 60)}min` : `${value}h`,
    rationale,
  };
}

export function inferBackupSchedulerConfigured(env: NodeJS.ProcessEnv): boolean {
  const explicit = env['BACKUP_SCHEDULE_CRON']?.trim() || env['BACKUP_INTERVAL_HOURS']?.trim();
  if (explicit) {
    return true;
  }
  return env['CD_REQUIRE_PRE_RELEASE_BACKUP'] === 'true';
}

export function analyzeContinuityCapabilities(
  env: NodeJS.ProcessEnv = process.env,
  measuredDr?: Pick<DrMetrics, 'rpoMeasuredMs' | 'rtoMeasuredMs'> | null,
): ContinuityCapabilities {
  const config = loadBackupConfig(env);
  const schedulerConfigured = inferBackupSchedulerConfigured(env);
  const backupIntervalHours = schedulerConfigured
    ? Number.parseInt(env['BACKUP_INTERVAL_HOURS'] ?? '24', 10) || 24
    : null;

  const rpoHours =
    backupIntervalHours && backupIntervalHours > 0
      ? backupIntervalHours
      : schedulerConfigured
        ? 24
        : null;

  const rpoAchievable = rpoHours
    ? durationFromHours(
        rpoHours,
        `pg_dump lógico (-Fc); perda máxima = intervalo entre backups bem-sucedidos (${rpoHours}h com agendamento atual). Sem WAL/PITR.`,
      )
    : durationFromHours(
        24,
        'Sem agendamento explícito no repositório: capacidade técnica existe (pg_dump), mas RPO efetivo depende da frequência operacional do backup. Referência conservadora: 24h com backup diário monitorado.',
      );

  const measuredRtoHours =
    measuredDr &&
    measuredDr.rtoMeasuredMs >= 30 * 60 * 1000 &&
    measuredDr.rtoMeasuredMs > 0
      ? hours(measuredDr.rtoMeasuredMs)
      : null;

  const rtoAchievable = measuredRtoHours
    ? durationFromHours(
        measuredRtoHours,
        `Medido em DR drill isolado (restore + verificação). Produção exige procedimento manual adicional (redeploy, smoke).`,
      )
    : durationFromHours(
        4,
        'Estimativa as-built: pg_restore + object storage tar + verificação + redeploy manual conforme dr-restore-runbook.md. Não medido em produção.',
      );

  return {
    backupMethod: 'pg_dump_fc_logical',
    walPitrEnabled: false,
    replicationEnabled: false,
    postgresBackupMode: config.postgresBackupMode,
    retentionDaily: config.retentionDaily,
    offsiteConfigured: Boolean(config.offsiteDir),
    backupSchedulerConfigured: schedulerConfigured,
    objectStorageBackupEnabled: config.enableObjectStorage,
    drScenarios: [
      'db_loss',
      'application_host_loss',
      'object_storage_partial_loss',
      'bad_deployment',
      'credential_rotation',
    ],
    applicationRollbackWithoutDbPitr: true,
    rpoAchievable,
    rtoAchievable,
    measuredDr: {
      rpoMs: measuredDr?.rpoMeasuredMs ?? null,
      rtoMs: measuredDr?.rtoMeasuredMs ?? null,
      source: measuredDr ? 'dr-drill metrics' : null,
    },
    limitations: [
      'Sem WAL archiving / PITR no código atual — RPO sub-horário não é suportado.',
      'Sem réplica PostgreSQL hot-standby — failover automático não disponível.',
      'Rollback de aplicação (Prompt 91) não restaura banco a um ponto no tempo.',
      'Retenção BACKUP_RETENTION_DAILY é de engenharia; retenção legal permanece DDP-019 OPEN.',
    ],
  };
}

export function summarizeDrValidation(
  drill: DrDrillResult | null,
  source: string | null = null,
): Ddp016Proposal['lastDrValidation'] {
  if (!drill) {
    return {
      status: 'NOT_RUN',
      scenario: null,
      finishedAt: null,
      rtoMeasuredMs: null,
      checksPassed: null,
      checksTotal: null,
      source,
      notes: 'Nenhum DR drill isolado registrado no caminho de status configurado.',
    };
  }

  const checksPassed = drill.checks.filter((check) => check.passed).length;
  return {
    status: drill.status,
    scenario: drill.scenario,
    finishedAt: drill.finishedAt,
    rtoMeasuredMs: drill.metrics.rtoMeasuredMs,
    checksPassed,
    checksTotal: drill.checks.length,
    source,
    notes:
      drill.metrics.rtoMeasuredMs < 30 * 60 * 1000
        ? 'RTO medido reflete drill automatizado isolado; RTO operacional de produção permanece estimado no tier.'
        : null,
  };
}

export function buildDdp016Proposal(
  env: NodeJS.ProcessEnv = process.env,
  measuredDr?: Pick<DrMetrics, 'rpoMeasuredMs' | 'rtoMeasuredMs'> | null,
  evaluatedAt = new Date(),
  lastDrValidation?: Ddp016Proposal['lastDrValidation'],
): Ddp016Proposal {
  const capabilities = analyzeContinuityCapabilities(env, measuredDr);

  const tiers: ContinuityTierProposal[] = [
    {
      id: 'conservative',
      title: 'Conservadora (as-built + backup diário monitorado)',
      rpo: durationFromHours(
        24,
        'Backup lógico diário (pg_dump) + snapshot object storage; perda máxima 24h.',
      ),
      rto: durationFromHours(
        4,
        'Restore manual PG + object storage + validação + redeploy conforme runbook.',
      ),
      achievability: 'ACHIEVABLE_NOW',
      dependencies: [
        'pnpm backup:run agendado (cron/CD) com BACKUP_STATUS_FILE monitorado',
        'BACKUP_ENCRYPTION_KEY em produção',
        'BACKUP_OFFSITE_DIR ou replicação de bucket',
        'DR drill trimestral em ambiente isolado',
      ],
      costOrImpact: 'Baixo — usa stack Prompt 84/85 sem nova infra.',
      restoreProcedure: 'docs/19-operations/dr-restore-runbook.md',
      restoreTest: 'pnpm dr:drill em DB/storage isolados',
    },
    {
      id: 'recommended',
      title: 'Recomendada (backup a cada 6h + drill documentado)',
      rpo: durationFromHours(
        6,
        'Mesmo mecanismo pg_dump com BACKUP_INTERVAL_HOURS=6 ou cron equivalente.',
      ),
      rto: durationFromHours(
        2,
        'Runbook ensaiado; restore automatizado parcial via dr-runner; redeploy CD.',
      ),
      achievability: 'REQUIRES_OPERATIONAL_CHANGE',
      dependencies: [
        'Agendamento backup 6h + alerta se ausente > 6h',
        'Off-site obrigatório',
        'DR drill após cada release major',
      ],
      costOrImpact: 'Moderado — maior volume de backup e atenção operacional.',
      restoreProcedure: 'docs/19-operations/dr-restore-runbook.md',
      restoreTest: 'pnpm dr:drill + smoke pós-restore',
    },
    {
      id: 'high_availability',
      title: 'Alta disponibilidade (PITR / réplica gerenciada)',
      rpo: durationFromHours(
        0.25,
        'Requer WAL/PITR ou PostgreSQL gerenciado com point-in-time recovery — não implementado.',
      ),
      rto: durationFromHours(
        1,
        'Requer failover automatizado ou hot standby — não implementado.',
      ),
      achievability: 'NOT_ACHIEVABLE_WITH_CURRENT_ARCHITECTURE',
      dependencies: [
        'PostgreSQL gerenciado com PITR ou streaming replica',
        'Failover DNS/load balancer',
        'Runbooks de promoção de réplica',
      ],
      costOrImpact: 'Alto — infraestrutura e operação 24x7; desproporcional ao baseline Prompt 82.',
      restoreProcedure: 'A definir após escolha de provedor gerenciado',
      restoreTest: 'A definir — não aplicável ao código atual',
    },
  ];

  return {
    decisionId: 'DDP-016',
    status: 'READY_FOR_APPROVAL',
    evaluatedAt: evaluatedAt.toISOString(),
    capabilities,
    tiers,
    recommendedTierId: 'recommended',
    humanDecisionRequired:
      'Patrocinador/operações devem escolher tier (conservadora ou recomendada), registrar RPO/RTO aprovados e approvedBy/approvedAt em readiness-evidence.json.',
    proposalReference: 'docs/19-operations/ddp-016-rpo-rto-proposal.json',
    lastDrValidation: lastDrValidation ?? summarizeDrValidation(null),
  };
}

export function formatDurationHours(duration: ContinuityDuration): string {
  return duration.label;
}
