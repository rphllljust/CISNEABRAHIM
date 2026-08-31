import { describe, expect, it } from 'vitest';
import {
  createPendingReadinessEvidence,
  loadReadinessEvidence,
  validateReadinessEvidenceRecord,
} from './readiness-evidence';
import type { ReadinessEvidenceRecord } from './readiness-evidence-types';
import {
  assertEngineeringContinuityAllowed,
  assertProductionOperationsAllowed,
  loadReadinessGateForOperations,
} from './production-operations-guard';
import {
  assertRootReadinessGateScriptDoesNotImportDotenv,
  evaluateExternalIntegrationsCheck,
  evaluateReadinessGate,
} from './readiness-gate';
import {
  approveBusinessSignOff,
  approveRpoRto,
  authorizePilotExit,
  recordPilotOperationalSnapshot,
} from './readiness-evidence-writer';
import { registerPilotStart } from '../pilot/pilot-start';
import { resolveReleaseCandidate } from './readiness-release';
import { ENGINEERING_READINESS_CHECK_IDS } from './readiness-types';

const GOOD_METRICS = {
  httpRequests: 500,
  httpErrors: 0,
  httpLatencyP95Ms: 200,
  dbQueries: 200,
  dbErrors: 0,
  dbPoolWaiting: 0,
  workerPending: 0,
  outboxFailed: 0,
  serviceOrdersOverdue: 0,
  billingAgingRecords: 0,
  openSupportTickets: 0,
  allocationConflictSignals: 0,
};

const HEALTHY_OPERATIONAL_SNAPSHOT = {
  recordedAt: '2026-08-30T12:00:00.000Z',
  httpErrorRate: 0,
  httpLatencyP95Ms: 200,
  httpRequests: 500,
  outboxFailed: 0,
  allocationConflictSignals: 0,
  billingAgingRecords: 0,
  openBlockers: 0,
  workerPending: 0,
  notes: 'test snapshot',
  source: 'test',
};

function approvedEvidence(overrides: Partial<ReadinessEvidenceRecord> = {}): ReadinessEvidenceRecord {
  const base = createPendingReadinessEvidence();
  return {
    ...base,
    releaseCandidate: {
      commitSha: 'abc123',
      artifactDigest: 'sha256:deadbeef',
      version: '0.0.0',
    },
    businessSignOff: {
      ...base.businessSignOff,
      decision: 'APPROVED',
      approvedBy: 'business-sponsor',
      approvedAt: '2026-08-01T12:00:00.000Z',
      releaseCandidate: {
        commitSha: 'abc123',
        artifactDigest: 'sha256:deadbeef',
        version: '0.0.0',
      },
    },
    rpoRto: {
      ...base.rpoRto,
      decision: 'APPROVED',
      rpo: '4h',
      rto: '8h',
      approvedBy: 'operations-lead',
      approvedAt: '2026-08-01T12:00:00.000Z',
      scope: 'production',
    },
    pilot: {
      ...base.pilot,
      phase: 'EXIT_READY',
      startedAt: '2026-08-01T00:00:00.000Z',
      exitAuthorizedAt: '2026-08-20T00:00:00.000Z',
      exitAuthorizedBy: 'release-engineer',
      observationWaiver: null,
      operationalResults: [HEALTHY_OPERATIONAL_SNAPSHOT],
    },
    manualUatUx: {
      ...base.manualUatUx,
      status: 'PASSED',
      sessionId: 'UAT-UX-001',
      performedBy: 'operator-1',
      performedAt: '2026-08-15T10:00:00.000Z',
      environment: 'pilot',
      releaseCandidate: {
        commitSha: 'abc123',
        artifactDigest: 'sha256:deadbeef',
        version: '0.0.0',
      },
      scenarios: ['login', 'service-request', 'service-order'],
      result: 'PASSED',
      approval: 'operator-1',
    },
    ...overrides,
  };
}

function evaluateWithEvidence(
  record: ReadinessEvidenceRecord,
  options: {
    env?: NodeJS.ProcessEnv;
    evaluationTime?: Date;
    releaseCandidate?: ReturnType<typeof resolveReleaseCandidate>;
    pilotMetrics?: typeof GOOD_METRICS;
  } = {},
) {
  return evaluateReadinessGate({
    env: options.env ?? {},
    evidence: { source: 'test', record, loadError: null },
    releaseCandidate:
      options.releaseCandidate ??
      ({
        commitSha: 'abc123',
        artifactDigest: 'sha256:deadbeef',
        version: '0.0.0',
        source: 'test',
      } as const),
    evaluationTime: options.evaluationTime ?? new Date('2026-08-30T12:00:00.000Z'),
    pilotMetrics: options.pilotMetrics ?? GOOD_METRICS,
    pilotStartedAt: record.pilot.startedAt ?? undefined,
  });
}

describe('readiness gate separation (engineering vs production)', () => {
  it('returns ENGINEERING READY + PRODUCTION NO-GO when governance evidence is pending', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence());

    expect(result.engineeringReadiness).toBe('READY');
    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.decision).toBe('NO-GO');
    expect(result.engineeringBlockers).toEqual([]);
    expect(result.productionBlockers).toContain('BUSINESS_SIGN_OFF_MISSING');
    expect(result.productionBlockers).toContain('RPO_RTO_NOT_DEFINED (DDP-016)');
    expect(result.productionBlockers).toContain('PILOT_NOT_STARTED');
    expect(result.productionBlockers).toContain('MANUAL_UAT_NOT_COMPLETED');
  });

  it('allows engineering continuity while production remains NO-GO', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence());
    expect(() => assertEngineeringContinuityAllowed(result)).not.toThrow();
    expect(() => assertProductionOperationsAllowed(result)).toThrow(/Production operations blocked/);
  });

  it('marks only engineering checks as engineering scope', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence());
    expect(result.engineeringChecks.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(ENGINEERING_READINESS_CHECK_IDS),
    );
    expect(result.productionChecks.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['uat', 'pilot', 'accessibility']),
    );
  });

  it('marks engineering gates PASS with evidence', () => {
    const result = evaluateReadinessGate({ env: {} });
    for (const id of ENGINEERING_READINESS_CHECK_IDS) {
      const entry = result.engineeringChecks.find((check) => check.id === id);
      if (entry?.status === 'CONDITIONAL') {
        continue;
      }
      expect(entry?.status, id).toBe('PASS');
    }
    expect(result.engineeringReadiness).toBe('READY');
  });

  it('returns PRODUCTION GO only when all authorized evidence is valid and consistent', () => {
    const result = evaluateWithEvidence(approvedEvidence(), {
      env: {
        CISNE_ENV: 'pilot',
        PILOT_PROGRAM_ENABLED: 'true',
        PILOT_STARTED_AT: '2026-08-01T00:00:00.000Z',
        PILOT_MIN_OBSERVATION_DAYS: '14',
      },
    });

    expect(result.engineeringReadiness).toBe('READY');
    expect(result.productionReadiness).toBe('GO');
    expect(result.productionBlockers).toEqual([]);
    expect(() => assertProductionOperationsAllowed(result)).not.toThrow();
  });

  it('returns PRODUCTION NO-GO when business sign-off is missing', () => {
    const result = evaluateWithEvidence(
      approvedEvidence({
        businessSignOff: {
          ...approvedEvidence().businessSignOff,
          decision: 'PENDING',
        },
      }),
    );

    expect(result.engineeringReadiness).toBe('READY');
    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers).toContain('BUSINESS_SIGN_OFF_MISSING');
  });

  it('returns PRODUCTION NO-GO when RPO/RTO is pending', () => {
    const result = evaluateWithEvidence(
      approvedEvidence({
        rpoRto: {
          ...approvedEvidence().rpoRto,
          decision: 'PENDING_APPROVAL',
          rpo: null,
          rto: null,
        },
      }),
    );

    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers).toContain('RPO_RTO_NOT_DEFINED (DDP-016)');
  });

  it('returns PRODUCTION NO-GO when RPO/RTO is defined but not approved', () => {
    const result = evaluateWithEvidence(
      approvedEvidence({
        rpoRto: {
          ...approvedEvidence().rpoRto,
          decision: 'DEFINED_BUT_NOT_APPROVED',
          rpo: '4h',
          rto: '8h',
        },
      }),
    );

    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers).toContain('RPO_RTO_DEFINED_BUT_NOT_APPROVED');
  });

  it('returns PRODUCTION NO-GO when manual UAT is missing', () => {
    const result = evaluateWithEvidence(
      approvedEvidence({
        manualUatUx: {
          ...approvedEvidence().manualUatUx,
          status: 'NOT_STARTED',
        },
      }),
    );

    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers).toContain('MANUAL_UAT_NOT_COMPLETED');
  });

  it('returns PRODUCTION NO-GO when pilot observation window is incomplete', () => {
    const result = evaluateWithEvidence(
      approvedEvidence({
        pilot: {
          ...approvedEvidence().pilot,
          phase: 'OBSERVATION',
          startedAt: '2026-08-25T00:00:00.000Z',
        },
      }),
      { evaluationTime: new Date('2026-08-30T12:00:00.000Z') },
    );

    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers).toContain('PILOT_OBSERVATION_WINDOW_NOT_COMPLETED');
  });

  it('returns PRODUCTION NO-GO when env claims approval without authorized evidence', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence(), {
      env: {
        READINESS_BUSINESS_SIGN_OFF: 'APPROVED',
        READINESS_RPO_RTO_APPROVED: 'true',
        UAT_MANUAL_UX_COMPLETED: 'true',
      },
    });

    expect(result.engineeringReadiness).toBe('READY');
    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.envMismatches.length).toBeGreaterThan(0);
    expect(result.productionBlockers.some((entry) => entry.startsWith('READINESS_EVIDENCE_MISMATCH'))).toBe(
      true,
    );
  });

  it('returns PRODUCTION NO-GO when release evidence does not match candidate', () => {
    const result = evaluateWithEvidence(approvedEvidence(), {
      releaseCandidate: {
        commitSha: 'different-sha',
        artifactDigest: 'sha256:other',
        version: '0.0.0',
        source: 'test',
      },
    });

    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers.some((entry) => entry.startsWith('READINESS_RELEASE_EVIDENCE_MISMATCH'))).toBe(
      true,
    );
  });

  it('returns PRODUCTION NO-GO when business sign-off was revoked', () => {
    const result = evaluateWithEvidence(
      approvedEvidence({
        businessSignOff: {
          ...approvedEvidence().businessSignOff,
          decision: 'REVOKED',
        },
      }),
    );

    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers).toContain('BUSINESS_SIGN_OFF_REVOKED');
  });

  it('fails production closed when evidence source is unavailable or malformed', () => {
    const malformed = loadReadinessEvidence('/nonexistent/readiness-evidence.json');
    expect(malformed.loadError).not.toBeNull();

    const result = evaluateReadinessGate({
      evidence: malformed,
      releaseCandidate: {
        commitSha: null,
        artifactDigest: null,
        version: null,
        source: 'unresolved',
      },
    });

    expect(result.engineeringReadiness).toBe('READY');
    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.productionBlockers.some((entry) => entry.includes('READINESS_EVIDENCE_UNAVAILABLE'))).toBe(
      true,
    );
    expect(validateReadinessEvidenceRecord({ schemaVersion: 2 })).not.toBeNull();
  });

  it('loads canonical evidence without blocking engineering continuity', () => {
    const result = loadReadinessGateForOperations({});
    expect(result.engineeringReadiness).toBe('READY');
    expect(() => assertEngineeringContinuityAllowed(result)).not.toThrow();
    if (result.productionReadiness === 'GO') {
      expect(result.productionBlockers).toEqual([]);
    }
  });

  it('defines support model roles without inventing personal data', () => {
    const result = evaluateReadinessGate({ env: {} });
    expect(result.support.technicalOwnerRole).toContain('SRE');
    expect(result.support.rollbackAuthority).toContain('Release');
    expect(result.support.escalationPath.length).toBeGreaterThan(10);
  });

  it('includes established baseline without changing production NO-GO', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence());
    expect(result.engineeringReadiness).toBe('READY');
    expect(result.productionReadiness).toBe('NO-GO');
    expect(result.establishedBaseline.items.length).toBeGreaterThan(10);
    expect(result.pendingHumanActions.length).toBe(4);
  });

  it('classifies ERP integration as ACL adapter, not live operation', () => {
    const check = evaluateExternalIntegrationsCheck({});
    expect(check.id).toBe('external_integrations');
    expect(check.status).toBe('PASS');
    expect(check.detail).toContain('adapter ACL');
    expect(check.detail).toContain('ACL_UNCONFIGURED');
  });

  it('reports operational engineering ready states without faking pilot or UAT completion', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence());
    expect(result.operationalEngineering.pilot).toBe('PILOT_READY_TO_START');
    expect(result.operationalEngineering.uat).toBe('UAT_READY_TO_EXECUTE');
    expect(result.operationalEngineering.pilotReady).toBe(true);
    expect(result.operationalEngineering.uatReady).toBe(true);
    expect(result.productionBlockers).toContain('PILOT_NOT_STARTED');
    expect(result.productionBlockers).toContain('MANUAL_UAT_NOT_COMPLETED');
  });

  it('rejects env flag UAT_MANUAL_UX_COMPLETED without closed session record', () => {
    const result = evaluateWithEvidence(createPendingReadinessEvidence(), {
      env: { UAT_MANUAL_UX_COMPLETED: 'true' },
    });
    expect(result.envMismatches).toContain(
      'READINESS_EVIDENCE_MISMATCH: env claims manual UAT completed without session record',
    );
  });

  it('does not import dotenv from root readiness script', () => {
    expect(() => assertRootReadinessGateScriptDoesNotImportDotenv()).not.toThrow();
  });
});

describe('readiness governance helpers', () => {
  const RC = {
    commitSha: 'abc123def',
    artifactDigest: null,
    version: '0.0.0-rc.1',
  } as const;

  it('approves conservative DDP-016 tier', () => {
    const result = approveRpoRto(createPendingReadinessEvidence(), {
      tierId: 'conservative',
      approvedBy: 'Abrahim Jabour Junior',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.record.rpoRto.decision).toBe('APPROVED');
    expect(result.record.rpoRto.rpo).toBe('24h');
    expect(result.record.rpoRto.rto).toBe('4h');
  });

  it('authorizes pilot exit only after observation window', () => {
    const startTime = new Date('2026-08-01T12:00:00.000Z');
    const started = registerPilotStart(
      createPendingReadinessEvidence(),
      {
        authorizedBy: 'release-engineer',
        responsible: 'sre-oncall',
        environment: 'pilot-hml',
        releaseCandidate: RC,
        startedAt: startTime.toISOString(),
      },
      startTime,
    );
    expect(started.validation.ok).toBe(true);

    const withSnapshot = recordPilotOperationalSnapshot(started.record, {
      recordedBy: 'release-engineer',
      snapshot: HEALTHY_OPERATIONAL_SNAPSHOT,
    });
    const exit = authorizePilotExit(
      withSnapshot,
      { authorizedBy: 'release-engineer' },
      new Date('2026-08-20T12:00:00.000Z'),
    );
    expect(exit.ok).toBe(true);
    if (!exit.ok) {
      return;
    }
    expect(exit.record.pilot.phase).toBe('EXIT_READY');
  });

  it('returns GO when governance evidence is complete', () => {
    let record = createPendingReadinessEvidence();
    record = approveRpoRto(record, {
      tierId: 'conservative',
      approvedBy: 'Abrahim Jabour Junior',
    }).record;
    record = approveBusinessSignOff(record, {
      approvedBy: 'Abrahim Jabour Junior',
      releaseCandidate: RC,
    }).record;
    record = registerPilotStart(
      record,
      {
        authorizedBy: 'release-engineer',
        responsible: 'sre-oncall',
        environment: 'pilot-hml',
        releaseCandidate: RC,
        startedAt: '2026-08-01T00:00:00.000Z',
      },
      new Date('2026-08-01T00:00:00.000Z'),
    ).record;
    record = recordPilotOperationalSnapshot(record, {
      recordedBy: 'release-engineer',
      snapshot: HEALTHY_OPERATIONAL_SNAPSHOT,
    });
    record = authorizePilotExit(record, { authorizedBy: 'release-engineer' }, new Date('2026-08-20T00:00:00.000Z'))
      .record;
    record = {
      ...record,
      manualUatUx: {
        ...approvedEvidence().manualUatUx,
        releaseCandidate: RC,
      },
      releaseCandidate: RC,
      businessSignOff: {
        ...record.businessSignOff,
        releaseCandidate: RC,
      },
      pilot: {
        ...record.pilot,
        releaseCandidate: RC,
      },
    };

    const result = evaluateWithEvidence(record, {
      evaluationTime: new Date('2026-08-30T12:00:00.000Z'),
      releaseCandidate: {
        commitSha: RC.commitSha,
        artifactDigest: null,
        version: RC.version,
        source: 'test',
      },
    });

    expect(result.productionReadiness).toBe('GO');
  });

  it('rejects pilot exit without recorded operational thresholds', () => {
    const startTime = new Date('2026-08-01T12:00:00.000Z');
    const started = registerPilotStart(
      createPendingReadinessEvidence(),
      {
        authorizedBy: 'release-engineer',
        responsible: 'sre-oncall',
        environment: 'pilot-hml',
        releaseCandidate: RC,
        startedAt: startTime.toISOString(),
      },
      startTime,
    );
    const exit = authorizePilotExit(
      started.record,
      { authorizedBy: 'release-engineer' },
      new Date('2026-08-20T12:00:00.000Z'),
    );
    expect(exit.ok).toBe(false);
    if (exit.ok) {
      return;
    }
    expect(exit.error).toMatch(/operational snapshot required/i);
  });

  it('authorizes early exit with explicit observation waiver and healthy thresholds', () => {
    const startTime = new Date('2026-08-30T12:00:00.000Z');
    const started = registerPilotStart(
      createPendingReadinessEvidence(),
      {
        authorizedBy: 'Abrahim Jabour Junior (Administrador)',
        responsible: 'release-engineer',
        environment: 'pilot-hml',
        releaseCandidate: RC,
        startedAt: startTime.toISOString(),
      },
      startTime,
    );
    const withSnapshot = recordPilotOperationalSnapshot(started.record, {
      recordedBy: 'Abrahim Jabour Junior (Administrador)',
      snapshot: HEALTHY_OPERATIONAL_SNAPSHOT,
    });
    const tooEarly = new Date('2026-08-30T18:00:00.000Z');
    const denied = authorizePilotExit(withSnapshot, { authorizedBy: 'Abrahim Jabour Junior (Administrador)' }, tooEarly);
    expect(denied.ok).toBe(false);

    const exit = authorizePilotExit(
      withSnapshot,
      {
        authorizedBy: 'Abrahim Jabour Junior (Administrador)',
        observationWaiver: {
          reason: 'Autorização explícita de saída do piloto pelo Administrador.',
        },
      },
      tooEarly,
    );
    expect(exit.ok).toBe(true);
    if (!exit.ok) {
      return;
    }
    expect(exit.record.pilot.phase).toBe('EXIT_READY');
    expect(exit.record.pilot.exitAuthorizedBy).toBe('Abrahim Jabour Junior (Administrador)');
    expect(exit.record.pilot.observationWaiver?.originalMinObservationDays).toBe(14);
  });
});
