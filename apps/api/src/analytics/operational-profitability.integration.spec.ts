import {
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateBillingTables,
  truncateClientTables,
  truncateIdentityAndAuthorizationTables,
  truncateServiceOrderTables,
  truncateServiceRequestTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyAuthTestEnv } from '../auth/test/auth-test-env';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PROFITABILITY_GROUP_BY } from './domain/operational-profitability-summary';
import { OperationalProfitabilityReadModelRepository } from './repositories/operational-profitability-read-model.repository';
import { OperationalProfitabilityAccessService } from './services/operational-profitability-access.service';

const UNIT_A = 'unit-profit-a';
const CLIENT_A = '11111111-1111-1111-1111-111111111111';

describe('Operational profitability PostgreSQL integration', () => {
  let pool: Pool;
  let service: OperationalProfitabilityAccessService;
  let identityA: string;
  let serviceOrderA: string;
  let serviceOrderB: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for operational profitability integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthorizationModule],
      providers: [OperationalProfitabilityReadModelRepository, OperationalProfitabilityAccessService],
    }).compile();

    service = module.get(OperationalProfitabilityAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM so.operational_cost_entries');
    await truncateBillingTables(pool);
    await truncateServiceOrderTables(pool);
    await truncateServiceRequestTables(pool);
    await truncateClientTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });

    const suffix = crypto.randomUUID();
    identityA = (await insertIdentity(pool, `profit-user-${suffix}`)).identityId;

    await pool.query(
      `INSERT INTO pty.clients (id, legal_name, normalized_tax_id, status, version)
       VALUES ($1::uuid, 'Cliente Rentabilidade', '11222333000181', 'ACTIVE', 1)`,
      [CLIENT_A],
    );

    for (const action of [
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      AUTHZ_ACTIONS.MeasurementsMeasurementRead,
      AUTHZ_ACTIONS.ServiceOrdersOperationalCostRead,
    ]) {
      await insertGrant(pool, {
        identityId: identityA,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        scopeType: AUTHZ_SCOPES.Unit,
        resourceId: UNIT_A,
        grantedByIdentityId: identityA,
      });
    }

    const snapshot = JSON.stringify({
      archetype: 'TRANSPORT',
      requirements: { execution: [], resources: [], labor: [] },
      allowedUnits: [{ unitCode: 'SERVICE' }],
    });

    const orders = await pool.query<{ id: string }>(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, client_id, contract_reference, status, origin,
         service_snapshot, row_version, created_by_identity_id, updated_by_identity_id,
         started_at, completed_at
       ) VALUES
       ($1, $2, $3, $4::uuid, 'CTR-001', 'COMPLETED', 'AUTHORIZED_DIRECT', $5::jsonb, 1, $6, $6,
        NOW() - INTERVAL '2 hours', NOW()),
       ($7, $8, $3, NULL, NULL, 'COMPLETED', 'AUTHORIZED_DIRECT', $5::jsonb, 1, $6, $6,
        NOW() - INTERVAL '2 hours', NOW())
       RETURNING id`,
      [
        `SO-PROFIT-A-${suffix}`,
        `SO-NUM-A-${suffix}`,
        UNIT_A,
        CLIENT_A,
        snapshot,
        identityA,
        `SO-PROFIT-B-${suffix}`,
        `SO-NUM-B-${suffix}`,
      ],
    );

    serviceOrderA = orders.rows[0]!.id;
    serviceOrderB = orders.rows[1]!.id;

    const executionEntry = await pool.query<{ id: string }>(
      `INSERT INTO so.execution_entries (
         service_order_id, entry_type, evidence_kind, quantity_value, quantity_unit_code,
         actor_identity_id, recorded_at, row_version
       ) VALUES ($1, 'QUANTITY', 'QUANTITY', 1, 'SERVICE', $2, NOW(), 1)
       RETURNING id`,
      [serviceOrderA, identityA],
    );
    const executionEntryId = executionEntry.rows[0]!.id;

    const measurement = await pool.query<{ id: string }>(
      `INSERT INTO msr.measurements (
         service_order_id, unit_id, status, commercial_reference_snapshot,
         decided_at, decided_by_identity_id, row_version,
         created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, $2, 'APPROVED', '{}'::jsonb, NOW(), $3, 1, $3, $3)
       RETURNING id`,
      [serviceOrderA, UNIT_A, identityA],
    );
    const measurementId = measurement.rows[0]!.id;

    await pool.query(
      `INSERT INTO msr.measurement_items (
         measurement_id, line_number, source_execution_entry_id, unit_code, actual_quantity, measured_quantity,
         unit_price, line_amount, pricing_line_snapshot
       ) VALUES ($1, 1, $2, 'SERVICE', 1, 1, 1000.0000, 1000.0000, '{}'::jsonb)`,
      [measurementId, executionEntryId],
    );

    await pool.query(
      `INSERT INTO so.operational_cost_entries (
         service_order_id, origin, category, cost_kind, amount, currency_code,
         actor_identity_id, recorded_at
       ) VALUES
       ($1, 'SERVICE_ORDER', 'FUEL', 'ACTUAL', 250.0000, 'BRL', $2, NOW()),
       ($1, 'SERVICE_ORDER', 'THIRD_PARTY', 'ACTUAL', 50.0000, 'BRL', $2, NOW())`,
      [serviceOrderA, identityA],
    );
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('computes operational margin from projected revenue and realized costs', async () => {
    const snapshot = await service.getOperationalProfitabilitySnapshot(
      { identityId: identityA, sessionId: 'session-profit' },
      { period: 'month', groupBy: PROFITABILITY_GROUP_BY.None },
    );

    expect(snapshot.summary.operationalRevenue).toBe('1000');
    expect(snapshot.summary.realizedCost).toBe('300');
    expect(snapshot.summary.operationalMargin).toBe('700');
    expect(snapshot.summary.formula).toContain('operational_margin');
    expect(snapshot.lines).toHaveLength(1);
  });

  it('groups profitability by client only when client data exists', async () => {
    const snapshot = await service.getOperationalProfitabilitySnapshot(
      { identityId: identityA, sessionId: 'session-profit' },
      { period: 'month', groupBy: PROFITABILITY_GROUP_BY.Client },
    );

    expect(snapshot.groups).toHaveLength(1);
    expect(snapshot.groups[0]?.key).toBe(CLIENT_A);
    expect(snapshot.supportedDimensions.client).toBe(true);
    expect(snapshot.supportedDimensions.contract).toBe(true);
  });

  it('filters by service order without persisting derived values', async () => {
    const snapshot = await service.getOperationalProfitabilitySnapshot(
      { identityId: identityA, sessionId: 'session-profit' },
      { period: 'month', serviceOrderId: serviceOrderB },
    );

    expect(snapshot.lines).toHaveLength(0);
    expect(snapshot.summary.serviceOrderCount).toBe(0);
  });

  it('denies profitability without revenue or cost visibility', async () => {
    const outsider = (await insertIdentity(pool, `profit-outsider-${crypto.randomUUID()}`)).identityId;
    await expect(
      service.getOperationalProfitabilitySnapshot(
        { identityId: outsider, sessionId: 'session-x' },
        { period: 'today' },
      ),
    ).rejects.toMatchObject({ code: 'ANALYTICS_ACCESS_DENIED' });
  });
});
