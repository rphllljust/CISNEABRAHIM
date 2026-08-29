import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertCatalogCategory,
  insertGrant,
  insertIdentity,
  truncateCatalogTables,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { CatalogModule } from './catalog.module';
import { CATALOG_ERROR_CODES } from './errors/catalog-error-codes';
import { CatalogHttpException } from './errors/catalog-http.exception';
import { ServiceCatalogAccessService } from './services/service-catalog-access.service';

const SAMPLE_UNITS = [{ unitCode: 'DAY', isDefault: true, sortOrder: 0 }];
const SAMPLE_RESOURCE_REQUIREMENTS = [
  {
    resourceTypeCode: 'WATER_TRUCK',
    requirementLevel: 'REQUIRED' as const,
    minQuantity: 1,
    sortOrder: 0,
  },
];
const EMPTY_RESOURCE_REQUIREMENTS: [] = [];
const SAMPLE_LABOR_REQUIREMENTS = [
  {
    laborTypeCode: 'DRIVER',
    requirementLevel: 'REQUIRED' as const,
    minQuantity: 1,
    sortOrder: 0,
  },
];
const EMPTY_LABOR_REQUIREMENTS: [] = [];

async function grantCatalogAdmin(
  pool: Pool,
  identityId: string,
  grantedBy: string,
): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.CatalogServiceCreate,
    AUTHZ_ACTIONS.CatalogServiceRead,
    AUTHZ_ACTIONS.CatalogServiceList,
    AUTHZ_ACTIONS.CatalogServiceUpdate,
    AUTHZ_ACTIONS.CatalogServicePublish,
    AUTHZ_ACTIONS.CatalogServiceDeactivate,
    AUTHZ_ACTIONS.CatalogServiceActivate,
  ];
  for (const action of actions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.CatalogService,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Service catalog PostgreSQL integration', () => {
  let pool: Pool;
  let catalogAccess: ServiceCatalogAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for service catalog integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, CatalogModule],
    }).compile();

    catalogAccess = module.get(ServiceCatalogAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string; categoryId: string }> {
    const login = normalizeLoginIdentifier(`catalog-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantCatalogAdmin(pool, identityId, identityId);
    const { categoryId } = await insertCatalogCategory(pool, { actorIdentityId: identityId });
    return { identityId, categoryId };
  }

  function createPayload(categoryId: string, code = 'LOCACAO_CAMINHAO_PIPA') {
    return {
      code,
      name: 'Locação Caminhão Pipa',
      categoryId,
      archetype: 'RENTAL',
      measurementMode: 'BY_PERIOD',
      allowedUnits: SAMPLE_UNITS,
    };
  }

  it('creates, reads, updates draft, publishes, deactivates and reactivates', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, createPayload(categoryId));
    expect(created.status).toBe('DRAFT');
    expect(created.code).toBe('LOCACAO_CAMINHAO_PIPA');
    expect(created.version).toBe(1);

    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    expect(definition.code).toBe('LOCACAO_CAMINHAO_PIPA');
    expect(definition.version).toBe(1);

    const updated = await catalogAccess.updateDraft(actor, created.serviceDefinitionId, 1, {
      lineageVersion: definition.version,
      name: 'Locação Caminhão Pipa — Rascunho',
      categoryId,
      archetype: 'RENTAL',
      measurementMode: 'BY_PERIOD',
      allowedUnits: SAMPLE_UNITS,
      resourceRequirements: EMPTY_RESOURCE_REQUIREMENTS,
      laborRequirements: EMPTY_LABOR_REQUIREMENTS,
    });
    expect(updated.name).toBe('Locação Caminhão Pipa — Rascunho');

    const definitionAfterUpdate = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    const published = await catalogAccess.publishVersion(
      actor,
      created.serviceDefinitionId,
      1,
      definitionAfterUpdate.version,
    );
    expect(published.status).toBe('PUBLISHED');

    const afterPublish = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    expect(afterPublish.latestPublishedVersion).toBe(1);

    const deactivated = await catalogAccess.deactivate(
      actor,
      created.serviceDefinitionId,
      afterPublish.version,
      'Descontinuado',
    );
    expect(deactivated.status).toBe('INACTIVE');

    const reactivated = await catalogAccess.activate(
      actor,
      created.serviceDefinitionId,
      deactivated.version,
    );
    expect(reactivated.status).toBe('ACTIVE');
  });

  it('rejects duplicate service codes', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const payload = createPayload(categoryId);

    await catalogAccess.create(actor, payload);

    await expect(catalogAccess.create(actor, { ...payload, name: 'Outro nome' })).rejects.toMatchObject({
      code: CATALOG_ERROR_CODES.CODE_CONFLICT,
    });
  });

  it('rejects updating a published version', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, createPayload(categoryId));
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    const published = await catalogAccess.publishVersion(
      actor,
      created.serviceDefinitionId,
      1,
      definition.version,
    );
    expect(published.status).toBe('PUBLISHED');

    await expect(
      catalogAccess.updateDraft(actor, created.serviceDefinitionId, 1, {
        lineageVersion: definition.version + 1,
        name: 'Tentativa inválida',
        categoryId,
        archetype: 'RENTAL',
        measurementMode: 'BY_PERIOD',
        allowedUnits: SAMPLE_UNITS,
        resourceRequirements: EMPTY_RESOURCE_REQUIREMENTS,
      laborRequirements: EMPTY_LABOR_REQUIREMENTS,
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.INVALID_STATE });
  });

  it('creates a new draft version from a published version', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, createPayload(categoryId));
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    await catalogAccess.publishVersion(actor, created.serviceDefinitionId, 1, definition.version);

    const version2 = await catalogAccess.createVersion(actor, created.serviceDefinitionId, {
      name: 'Locação Caminhão Pipa v2',
      categoryId,
      archetype: 'RENTAL',
      measurementMode: 'BY_PERIOD',
      allowedUnits: SAMPLE_UNITS,
      resourceRequirements: EMPTY_RESOURCE_REQUIREMENTS,
      laborRequirements: EMPTY_LABOR_REQUIREMENTS,
      sourceVersion: 1,
    });
    expect(version2.version).toBe(2);
    expect(version2.status).toBe('DRAFT');

    const versions = await catalogAccess.listVersions(actor, created.serviceDefinitionId);
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
  });

  it('rejects invalid publish when allowed units are missing', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, createPayload(categoryId));
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);

    await pool.query(`DELETE FROM cat.service_allowed_units WHERE service_definition_version_id = $1`, [
      created.id,
    ]);

    await expect(
      catalogAccess.publishVersion(actor, created.serviceDefinitionId, 1, definition.version),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.INVALID_UNIT });
  });

  it('detects optimistic concurrency conflicts on draft update', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, createPayload(categoryId));
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);

    await catalogAccess.updateDraft(actor, created.serviceDefinitionId, 1, {
      lineageVersion: definition.version,
      name: 'Primeira alteração',
      categoryId,
      archetype: 'RENTAL',
      measurementMode: 'BY_PERIOD',
      allowedUnits: SAMPLE_UNITS,
      resourceRequirements: EMPTY_RESOURCE_REQUIREMENTS,
      laborRequirements: EMPTY_LABOR_REQUIREMENTS,
    });

    await expect(
      catalogAccess.updateDraft(actor, created.serviceDefinitionId, 1, {
        lineageVersion: definition.version,
        name: 'Alteração obsoleta',
        categoryId,
        archetype: 'RENTAL',
        measurementMode: 'BY_PERIOD',
        allowedUnits: SAMPLE_UNITS,
        resourceRequirements: EMPTY_RESOURCE_REQUIREMENTS,
      laborRequirements: EMPTY_LABOR_REQUIREMENTS,
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.VERSION_CONFLICT });
  });

  it('denies access without grants and rejects non-global scope', async () => {
    const admin = await seedActor();
    const employeeLogin = normalizeLoginIdentifier(`catalog-employee-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: employeeId } = await insertIdentity(pool, employeeLogin, passwordHash);

    const created = await catalogAccess.create(
      { identityId: admin.identityId, sessionId: 'sid' },
      createPayload(admin.categoryId),
    );

    await expect(
      catalogAccess.listDefinitions({ identityId: employeeId, sessionId: 'sid' }, { limit: 20, offset: 0 }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.DENIED });

    await insertGrant(pool, {
      identityId: employeeId,
      action: AUTHZ_ACTIONS.CatalogServiceRead,
      resourceType: AUTHZ_RESOURCE_TYPES.CatalogService,
      scopeType: AUTHZ_SCOPES.Client,
      resourceId: created.serviceDefinitionId,
      grantedByIdentityId: admin.identityId,
    });

    await expect(
      catalogAccess.getDefinition({ identityId: employeeId, sessionId: 'sid' }, created.serviceDefinitionId),
    ).rejects.toBeInstanceOf(CatalogHttpException);
  });

  it('returns not found for unknown definitions without leaking ORM fields', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    await expect(catalogAccess.getDefinition(actor, crypto.randomUUID())).rejects.toMatchObject({
      code: CATALOG_ERROR_CODES.NOT_FOUND,
    });

    const { identityId: categoryActor, categoryId } = await seedActor();
    const created = await catalogAccess.create(
      { identityId: categoryActor, sessionId: 'sid' },
      createPayload(categoryId),
    );
    const response = JSON.parse(JSON.stringify(created)) as Record<string, unknown>;
    expect(response).not.toHaveProperty('service_definition_id');
    expect(response).not.toHaveProperty('allowed_units');
    expect(response).toHaveProperty('allowedUnits');
  });

  it('lists definitions with pagination and stable ordering', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    await catalogAccess.create(actor, createPayload(categoryId, 'SERVICE_ALPHA'));
    await catalogAccess.create(actor, createPayload(categoryId, 'SERVICE_BETA'));

    const page = await catalogAccess.listDefinitions(actor, { limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.limit).toBe(1);
    expect(page.offset).toBe(0);

    const all = await catalogAccess.listDefinitions(actor, { limit: 20, offset: 0 });
    expect(all.items.map((item) => item.code)).toEqual(['SERVICE_ALPHA', 'SERVICE_BETA']);
  });

  it('rejects unknown unit codes on service definition create', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    await expect(
      catalogAccess.create(actor, {
        ...createPayload(categoryId),
        allowedUnits: [{ unitCode: 'NOT_A_UNIT', isDefault: true }],
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.INVALID_UNIT });
  });

  it('keeps historical published versions valid when a unit is later deactivated', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, createPayload(categoryId));
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    await catalogAccess.publishVersion(actor, created.serviceDefinitionId, 1, definition.version);

    const day = await pool.query<{ id: string; version: number }>(
      `SELECT id, version FROM cat.units_of_measure WHERE code = 'DAY'`,
    );
    const dayRow = day.rows[0];
    expect(dayRow).toBeDefined();

    await pool.query(
      `UPDATE cat.units_of_measure
       SET status = 'INACTIVE', version = version + 1, deactivated_at = now()
       WHERE id = $1`,
      [dayRow!.id],
    );

    const historical = await catalogAccess.getVersion(actor, created.serviceDefinitionId, 1);
    expect(historical.status).toBe('PUBLISHED');
    expect(historical.allowedUnits.some((unit) => unit.unitCode === 'DAY')).toBe(true);

    await expect(catalogAccess.create(actor, createPayload(categoryId, 'NEW_AFTER_INACTIVE'))).rejects
      .toMatchObject({ code: CATALOG_ERROR_CODES.INACTIVE_UNIT });
  });

  it('associates physical resource type requirements on service definitions', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, {
      ...createPayload(categoryId),
      resourceRequirements: SAMPLE_RESOURCE_REQUIREMENTS,
    });
    expect(created.resourceRequirements).toEqual([
      {
        resourceTypeCode: 'WATER_TRUCK',
        requirementLevel: 'REQUIRED',
        minQuantity: 1,
        sortOrder: 0,
      },
    ]);
  });

  it('rejects unknown resource type codes on service definition create', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    await expect(
      catalogAccess.create(actor, {
        ...createPayload(categoryId),
        resourceRequirements: [
          {
            resourceTypeCode: 'NOT_A_TYPE',
            requirementLevel: 'REQUIRED',
            minQuantity: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.INVALID_RESOURCE_TYPE });
  });

  it('keeps historical published versions valid when a resource type is later deactivated', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, {
      ...createPayload(categoryId),
      resourceRequirements: SAMPLE_RESOURCE_REQUIREMENTS,
    });
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    await catalogAccess.publishVersion(actor, created.serviceDefinitionId, 1, definition.version);

    const waterTruck = await pool.query<{ id: string; version: number }>(
      `SELECT id, version FROM cat.physical_resource_types WHERE code = 'WATER_TRUCK'`,
    );
    const typeRow = waterTruck.rows[0];
    expect(typeRow).toBeDefined();

    await pool.query(
      `UPDATE cat.physical_resource_types
       SET status = 'INACTIVE', version = version + 1, deactivated_at = now()
       WHERE id = $1`,
      [typeRow!.id],
    );

    const historical = await catalogAccess.getVersion(actor, created.serviceDefinitionId, 1);
    expect(historical.status).toBe('PUBLISHED');
    expect(
      historical.resourceRequirements.some((requirement) => requirement.resourceTypeCode === 'WATER_TRUCK'),
    ).toBe(true);

    await expect(
      catalogAccess.create(actor, {
        ...createPayload(categoryId, 'NEW_AFTER_INACTIVE_TYPE'),
        resourceRequirements: SAMPLE_RESOURCE_REQUIREMENTS,
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.INACTIVE_RESOURCE_TYPE });
  });

  it('copies resource requirements when creating a draft version from source', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, {
      ...createPayload(categoryId),
      resourceRequirements: SAMPLE_RESOURCE_REQUIREMENTS,
    });
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    await catalogAccess.publishVersion(actor, created.serviceDefinitionId, 1, definition.version);

    const version2 = await catalogAccess.createVersion(actor, created.serviceDefinitionId, {
      name: 'Locação Caminhão Pipa v2',
      categoryId,
      archetype: 'RENTAL',
      measurementMode: 'BY_PERIOD',
      allowedUnits: SAMPLE_UNITS,
      resourceRequirements: EMPTY_RESOURCE_REQUIREMENTS,
      laborRequirements: EMPTY_LABOR_REQUIREMENTS,
      sourceVersion: 1,
    });

    expect(version2.resourceRequirements).toEqual([
      {
        resourceTypeCode: 'WATER_TRUCK',
        requirementLevel: 'REQUIRED',
        minQuantity: 1,
        sortOrder: 0,
      },
    ]);
  });

  it('associates labor type requirements on service definitions', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, {
      ...createPayload(categoryId, 'LOCACAO_CAMINHAO_PIPA_LABOR'),
      laborRequirements: SAMPLE_LABOR_REQUIREMENTS,
    });
    expect(created.laborRequirements).toEqual([
      {
        laborTypeCode: 'DRIVER',
        requirementLevel: 'REQUIRED',
        minQuantity: 1,
        sortOrder: 0,
      },
    ]);
  });

  it('rejects unknown labor type codes on service definition create', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    await expect(
      catalogAccess.create(actor, {
        ...createPayload(categoryId),
        laborRequirements: [
          {
            laborTypeCode: 'NOT_A_LABOR_TYPE',
            requirementLevel: 'REQUIRED',
            minQuantity: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.INVALID_LABOR_TYPE });
  });

  it('keeps historical published versions valid when a labor type is later deactivated', async () => {
    const { identityId, categoryId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await catalogAccess.create(actor, {
      ...createPayload(categoryId, 'INSTALACAO_ELETRICA'),
      laborRequirements: [{ laborTypeCode: 'ELECTRICIAN', requirementLevel: 'REQUIRED', minQuantity: 1 }],
    });
    const definition = await catalogAccess.getDefinition(actor, created.serviceDefinitionId);
    await catalogAccess.publishVersion(actor, created.serviceDefinitionId, 1, definition.version);

    const electrician = await pool.query<{ id: string }>(
      `SELECT id FROM cat.operational_labor_types WHERE code = 'ELECTRICIAN'`,
    );
    const typeRow = electrician.rows[0];
    expect(typeRow).toBeDefined();

    await pool.query(
      `UPDATE cat.operational_labor_types
       SET status = 'INACTIVE', version = version + 1, deactivated_at = now()
       WHERE id = $1`,
      [typeRow!.id],
    );

    const historical = await catalogAccess.getVersion(actor, created.serviceDefinitionId, 1);
    expect(historical.laborRequirements.some((requirement) => requirement.laborTypeCode === 'ELECTRICIAN')).toBe(
      true,
    );
  });

  it('does not expose employee or assignment concepts in labor type catalog', async () => {
    const tables = await pool.query<{ tablename: string }>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname IN ('cat', 'pty', 'identity')
         AND tablename ~* '(employee|assignment|payroll|personnel)'`,
    );
    expect(tables.rows).toEqual([]);
  });
});
