#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const requireFromApi = createRequire(resolve(process.cwd(), 'apps/api/package.json'));
requireFromApi('reflect-metadata');

const { Test } = requireFromApi('@nestjs/testing');
const { Pool } = requireFromApi('pg');
const {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  insertScopeRef,
} = requireFromApi('@cisne/database');

const { AuthModule } = requireFromApi('./dist/auth/auth.module.js');
const { AuditModule } = requireFromApi('./dist/audit/audit.module.js');
const { AuthorizationModule } = requireFromApi('./dist/authorization/authorization.module.js');
const { ClientsModule } = requireFromApi('./dist/clients/clients.module.js');
const { CatalogModule } = requireFromApi('./dist/catalog/catalog.module.js');
const { CommercialModule } = requireFromApi('./dist/commercial/commercial.module.js');
const { DocumentsModule } = requireFromApi('./dist/documents/documents.module.js');
const { ResourcesModule } = requireFromApi('./dist/resources/resources.module.js');
const { RequestsModule } = requireFromApi('./dist/requests/requests.module.js');
const { ServiceOrdersModule } = requireFromApi('./dist/service-orders/service-orders.module.js');
const { MeasurementsModule } = requireFromApi('./dist/measurements/measurements.module.js');
const { BillingModule } = requireFromApi('./dist/billing/billing.module.js');
const { FaultInjectionModule } = requireFromApi('./dist/platform/fault-injection/fault-injection.module.js');

const { ClientAccessService } = requireFromApi('./dist/clients/services/client-access.service.js');
const { ServiceCatalogAccessService } = requireFromApi('./dist/catalog/services/service-catalog-access.service.js');
const { ProposalsAccessService } = requireFromApi('./dist/commercial/services/proposals-access.service.js');
const { PurchaseOrdersAccessService } = requireFromApi('./dist/commercial/services/purchase-orders-access.service.js');
const { DocumentsAccessService } = requireFromApi('./dist/documents/services/documents-access.service.js');
const { ServiceRequestsAccessService } = requireFromApi('./dist/requests/services/service-requests-access.service.js');
const { ServiceOrdersAccessService } = requireFromApi('./dist/service-orders/services/service-orders-access.service.js');
const { ServiceOrderPlanningAccessService } = requireFromApi(
  './dist/service-orders/services/service-order-planning-access.service.js',
);
const { ServiceOrderExecutionAccessService } = requireFromApi(
  './dist/service-orders/services/service-order-execution-access.service.js',
);
const { MeasurementsAccessService } = requireFromApi('./dist/measurements/services/measurements-access.service.js');
const { BillingAccessService } = requireFromApi('./dist/billing/services/billing-access.service.js');
const { BillingDocumentAccessService } = requireFromApi(
  './dist/billing/services/billing-document-access.service.js',
);
const { PhysicalAssetsAccessService } = requireFromApi(
  './dist/resources/services/physical-assets-access.service.js',
);
const { PhysicalResourceTypesAccessService } = requireFromApi(
  './dist/resources/services/physical-resource-types-access.service.js',
);

const { UAT_SCENARIOS } = requireFromApi('./dist/uat/uat-scenarios.js');
const { runUatVerticalScenario } = requireFromApi('./dist/uat/uat-vertical-runner.js');

const DEFAULT_LOGIN = 'dev-operator@cisne-rondonia.invalid';
const DEFAULT_UNIT_ID = 'unit-demo-local';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = trimmed.slice(separatorIndex + 1).trim();
  }
}

async function resolveDevIdentityId(pool, login) {
  const result = await pool.query(
    `SELECT identity_id
     FROM identity.credentials
     WHERE login_identifier_normalized = $1
       AND revoked_at IS NULL
     LIMIT 1`,
    [login],
  );
  return result.rows[0]?.identity_id ?? null;
}

async function collectCounts(pool) {
  const queries = [
    ['clients', 'SELECT count(*)::int AS n FROM pty.clients'],
    ['proposals', 'SELECT count(*)::int AS n FROM com.proposals'],
    ['purchaseOrders', 'SELECT count(*)::int AS n FROM com.purchase_orders'],
    ['serviceRequests', 'SELECT count(*)::int AS n FROM sr.service_requests'],
    ['serviceOrders', 'SELECT count(*)::int AS n FROM so.service_orders'],
    ['measurements', 'SELECT count(*)::int AS n FROM msr.measurements'],
    ['billingRecords', 'SELECT count(*)::int AS n FROM bil.billing_records'],
    ['billingDocuments', 'SELECT count(*)::int AS n FROM bil.billing_documents'],
  ];
  const counts = {};
  for (const [key, sql] of queries) {
    const result = await pool.query(sql);
    counts[key] = result.rows[0]?.n ?? 0;
  }
  return counts;
}

async function main() {
  loadEnvFile(resolve(process.cwd(), '.env'));
  process.env['JWT_SECRET'] ??= 'local-dev-jwt-secret-at-least-32-chars';
  process.env['NODE_ENV'] ??= 'development';
  process.env['OBJECT_STORAGE_PROVIDER'] ??= 'filesystem';
  process.env['OBJECT_STORAGE_ROOT'] ??= '.object-storage-dev-seed';

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const login = (process.env['DEV_OPERATOR_LOGIN'] ?? DEFAULT_LOGIN).trim().toLowerCase();
  const unitId = (process.env['DEV_DEMO_UNIT_ID'] ?? DEFAULT_UNIT_ID).trim();

  const pool = new Pool({ connectionString: databaseUrl });
  let moduleRef;

  try {
    const identityId = await resolveDevIdentityId(pool, login);
    if (!identityId) {
      throw new Error(
        `Dev operator not found (${login}). Run pnpm auth:repair:dev-login and try again.`,
      );
    }

    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: unitId });

    moduleRef = await Test.createTestingModule({
      imports: [
        FaultInjectionModule,
        AuthModule,
        AuditModule,
        AuthorizationModule,
        ClientsModule,
        CatalogModule,
        CommercialModule,
        DocumentsModule,
        ResourcesModule,
        RequestsModule,
        ServiceOrdersModule,
        MeasurementsModule,
        BillingModule,
      ],
    }).compile();

    const services = {
      pool,
      clientAccess: moduleRef.get(ClientAccessService),
      catalogAccess: moduleRef.get(ServiceCatalogAccessService),
      proposalsAccess: moduleRef.get(ProposalsAccessService),
      purchaseOrdersAccess: moduleRef.get(PurchaseOrdersAccessService),
      serviceRequestsAccess: moduleRef.get(ServiceRequestsAccessService),
      documentsAccess: moduleRef.get(DocumentsAccessService),
      serviceOrdersAccess: moduleRef.get(ServiceOrdersAccessService),
      planningAccess: moduleRef.get(ServiceOrderPlanningAccessService),
      executionAccess: moduleRef.get(ServiceOrderExecutionAccessService),
      measurementsAccess: moduleRef.get(MeasurementsAccessService),
      billingAccess: moduleRef.get(BillingAccessService),
      billingDocumentAccess: moduleRef.get(BillingDocumentAccessService),
      assetsAccess: moduleRef.get(PhysicalAssetsAccessService),
      resourceTypesAccess: moduleRef.get(PhysicalResourceTypesAccessService),
    };

    const actor = { identityId, sessionId: 'sid-dev-demo-seed' };
    const scenarios = UAT_SCENARIOS.slice(0, 2);
    const executed = [];

    for (const scenario of scenarios) {
      const result = await runUatVerticalScenario(services, scenario, actor, unitId);
      executed.push({
        id: scenario.id,
        title: scenario.title,
        status: result.status,
        serviceOrderId: result.serviceOrderId ?? null,
        billingDocumentId: result.billingDocumentId ?? null,
      });
    }

    const counts = await collectCounts(pool);
    process.stdout.write(
      `${JSON.stringify({
        login,
        unitId,
        scenariosExecuted: executed,
        counts,
      })}\n`,
    );
  } finally {
    await moduleRef?.close?.().catch(() => undefined);
    await pool.end();
  }
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : 'unknown error';
  console.error(reason);
  process.exit(1);
});
