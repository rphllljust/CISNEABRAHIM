import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertCatalogHistoricalAfterUpdate,
  assertDomainInvariants,
  assertPoHistoricalAfterClientUpdate,
  assertProposalIssuedNotOverwritten,
} from './master-business-invariants';
import { runNegativeJourneyChecks } from './master-business-negative';
import { assertFinancialReconciliation } from './master-business-reconciliation';
import { assertTimelineIntegrity, reconstructBusinessTimeline } from './master-business-timeline';
import { createMasterBusinessTestContext, MASTER_BUSINESS_UNIT } from './master-business-harness';
import { runUatVerticalScenario } from '../uat/uat-vertical-runner';
import { UAT_SCENARIOS } from '../uat/uat-scenarios';

describe('Master business E2E & invariant testing (Prompt 98)', () => {
  let pool: Awaited<ReturnType<typeof createMasterBusinessTestContext>>['pool'];
  let services: Awaited<ReturnType<typeof createMasterBusinessTestContext>>['services'];
  let seedAdminActor: Awaited<ReturnType<typeof createMasterBusinessTestContext>>['seedAdminActor'];
  let resetDatabase: Awaited<ReturnType<typeof createMasterBusinessTestContext>>['resetDatabase'];

  beforeAll(async () => {
    const ctx = await createMasterBusinessTestContext();
    pool = ctx.pool;
    services = ctx.services;
    seedAdminActor = ctx.seedAdminActor;
    resetDatabase = ctx.resetDatabase;
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  for (const scenario of UAT_SCENARIOS) {
    it(`happy path — ${scenario.title}`, async () => {
      const actor = await seedAdminActor();
      const result = await runUatVerticalScenario(services, scenario, actor, MASTER_BUSINESS_UNIT, {
        captureArtifacts: true,
      });
      expect(result.status, result.error).toBe('PASS');
      expect(result.artifacts).toBeTruthy();
    });
  }

  it('proves domain invariants across a complete journey', async () => {
    const actor = await seedAdminActor();
    const result = await runUatVerticalScenario(services, UAT_SCENARIOS[0]!, actor, MASTER_BUSINESS_UNIT, {
      captureArtifacts: true,
    });
    expect(result.artifacts).toBeTruthy();
    await assertDomainInvariants(services, actor, result.artifacts!);
  });

  it('preserves historical catalog, PO and proposal snapshots after mutations', async () => {
    const actor = await seedAdminActor();
    const result = await runUatVerticalScenario(services, UAT_SCENARIOS[2]!, actor, MASTER_BUSINESS_UNIT, {
      captureArtifacts: true,
    });
    const artifacts = result.artifacts!;

    await assertCatalogHistoricalAfterUpdate(
      services.catalogAccess,
      actor,
      artifacts.serviceDefinitionId,
      artifacts.publishedVersionNumber,
      artifacts.publishedServiceCode,
    );
    await assertPoHistoricalAfterClientUpdate(
      pool,
      services.clientAccess,
      services.purchaseOrdersAccess,
      actor,
      artifacts,
    );
    await assertProposalIssuedNotOverwritten(services.proposalsAccess, actor, artifacts);
  });

  it('executes negative journeys without partial state', async () => {
    const actor = await seedAdminActor();
    await runNegativeJourneyChecks(services, actor, MASTER_BUSINESS_UNIT);
  });

  it('reconciles OS, execution, measurement, billing and nota fatura amounts', async () => {
    const actor = await seedAdminActor();
    const result = await runUatVerticalScenario(services, UAT_SCENARIOS[1]!, actor, MASTER_BUSINESS_UNIT, {
      captureArtifacts: true,
    });
    await assertFinancialReconciliation(services, actor, result.artifacts!);
  });

  it('reconstructs auditable timeline without fabricated events', async () => {
    const actor = await seedAdminActor();
    const result = await runUatVerticalScenario(services, UAT_SCENARIOS[0]!, actor, MASTER_BUSINESS_UNIT, {
      captureArtifacts: true,
    });
    const timeline = await reconstructBusinessTimeline(pool, result.artifacts!);
    assertTimelineIntegrity(timeline, actor.identityId);
  });

  it('runs independent repetitions without cross-test contamination', async () => {
    const actor = await seedAdminActor();
    const runs = [];

    for (let index = 0; index < 3; index += 1) {
      const result = await runUatVerticalScenario(services, UAT_SCENARIOS[index % UAT_SCENARIOS.length]!, actor, MASTER_BUSINESS_UNIT, {
        captureArtifacts: true,
      });
      expect(result.status, result.error).toBe('PASS');
      runs.push(result.artifacts!);
    }

    const uniqueOrderIds = new Set(runs.map((run) => run.serviceOrderId));
    const uniqueClientIds = new Set(runs.map((run) => run.clientId));
    expect(uniqueOrderIds.size).toBe(3);
    expect(uniqueClientIds.size).toBe(3);
  });
});
