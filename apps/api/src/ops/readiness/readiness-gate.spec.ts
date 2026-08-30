import { describe, expect, it } from 'vitest';
import { evaluateProductionReadinessGate } from './readiness-gate';

describe('production readiness gate (Prompt 92)', () => {
  it('returns NO-GO when business sign-off and RPO/RTO are pending', () => {
    const result = evaluateProductionReadinessGate({
      env: {
        CISNE_ENV: 'pilot',
        PILOT_PROGRAM_ENABLED: 'true',
        PILOT_STARTED_AT: '2026-08-30T00:00:00.000Z',
        PILOT_MIN_OBSERVATION_DAYS: '14',
      },
      pilotMetrics: {
        httpRequests: 100,
        httpErrors: 0,
        httpLatencyP95Ms: 100,
        dbQueries: 50,
        dbErrors: 0,
        dbPoolWaiting: 0,
        workerPending: 0,
        outboxFailed: 0,
        serviceOrdersOverdue: 0,
        billingAgingRecords: 0,
        openSupportTickets: 0,
      },
    });

    expect(result.decision).toBe('NO-GO');
    expect(result.blockers).toContain('BUSINESS_STAKEHOLDER_SIGN_OFF_PENDING');
    expect(result.blockers).toContain('RPO_RTO_TARGET_NOT_DEFINED (DDP-016)');
    expect(result.blockers.some((entry) => entry.includes('PILOT_NOT_EXIT_READY'))).toBe(true);
    expect(result.blockers).toContain('UAT_MANUAL_UX_CHECKLIST_PENDING');
  });

  it('marks engineering gates PASS with evidence', () => {
    const result = evaluateProductionReadinessGate({ env: {} });
    const engineeringIds = [
      'ci',
      'cd',
      'security',
      'load_tests',
      'backup',
      'restore',
      'dr',
      'observability',
      'alerts',
      'rollback',
      'tls',
      'secrets',
      'migrations',
      'e2e',
    ] as const;

    for (const id of engineeringIds) {
      const entry = result.checks.find((check) => check.id === id);
      expect(entry?.status, id).toBe('PASS');
    }
  });

  it('returns GO only when all blockers are explicitly cleared', () => {
    const result = evaluateProductionReadinessGate({
      env: {
        CISNE_ENV: 'pilot',
        READINESS_BUSINESS_SIGN_OFF: 'APPROVED',
        READINESS_RPO_RTO_APPROVED: 'true',
        UAT_MANUAL_UX_COMPLETED: 'true',
        PILOT_PROGRAM_ENABLED: 'true',
        PILOT_STARTED_AT: '2026-08-01T00:00:00.000Z',
        PILOT_MIN_OBSERVATION_DAYS: '14',
      },
      pilotMetrics: {
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
      },
    });

    expect(result.decision).toBe('GO');
    expect(result.blockers).toEqual([]);
  });

  it('defines support model roles without inventing personal data', () => {
    const result = evaluateProductionReadinessGate({ env: {} });
    expect(result.support.technicalOwnerRole).toContain('SRE');
    expect(result.support.rollbackAuthority).toContain('Release');
    expect(result.support.escalationPath.length).toBeGreaterThan(10);
  });
});
