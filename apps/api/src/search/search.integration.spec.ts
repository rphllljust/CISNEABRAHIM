import {
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateClientTables,
  truncateIdentityAndAuthorizationTables,
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
import { SEARCH_ENTITY_TYPES } from './domain/search-entity-type';
import { SearchModule } from './search.module';
import { SearchAccessService } from './services/search-access.service';

const UNIT_A = 'unit-search-a';
const UNIT_B = 'unit-search-b';

describe('Search PostgreSQL integration', () => {
  let pool: Pool;
  let searchService: SearchAccessService;
  let identityA: string;
  let identityB: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for search integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthorizationModule, SearchModule],
    }).compile();

    searchService = module.get(SearchAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateClientTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_B });

    const suffix = crypto.randomUUID();
    identityA = (await insertIdentity(pool, `search-a-${suffix}`)).identityId;
    identityB = (await insertIdentity(pool, `search-b-${suffix}`)).identityId;

    await insertGrant(pool, {
      identityId: identityA,
      action: AUTHZ_ACTIONS.ClientList,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityA,
    });
    await insertGrant(pool, {
      identityId: identityB,
      action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityB,
    });
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('finds client by normalized CNPJ', async () => {
    const taxId = '12345678000190';
    await pool.query(
      `INSERT INTO pty.clients (
         legal_name, trade_name, normalized_tax_id, status
       ) VALUES ('Empresa Alfa', 'Alfa', $1, 'ACTIVE')`,
      [taxId],
    );

    const response = await searchService.search(
      { identityId: identityA, sessionId: 's-1' },
      { q: '12.345.678/0001-90', types: SEARCH_ENTITY_TYPES.Client },
    );

    expect(response.groups[0]?.items).toHaveLength(1);
    expect(response.groups[0]?.items[0]?.title).toContain('Alfa');
  });

  it('denies cross-scope service order visibility (IDOR)', async () => {
    await pool.query(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, status, origin, service_snapshot,
         row_version, created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, $2, $3, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4),
              ($5, $6, $7, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4)`,
      [
        `SO-INT-A-${crypto.randomUUID()}`,
        'SO-SCOPED-A',
        UNIT_A,
        identityA,
        `SO-INT-B-${crypto.randomUUID()}`,
        'SO-SCOPED-B',
        UNIT_B,
      ],
    );

    const response = await searchService.search(
      { identityId: identityB, sessionId: 's-2' },
      { q: 'SO-SCOPED', types: SEARCH_ENTITY_TYPES.ServiceOrder },
    );

    const items = response.groups.flatMap((group) => group.items);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('SO-SCOPED-A');
  });

  it('returns empty groups for no result without leaking other units', async () => {
    const response = await searchService.search(
      { identityId: identityB, sessionId: 's-3' },
      { q: 'INEXISTENTE-XYZ-999' },
    );
    expect(response.groups).toHaveLength(0);
  });

  it('paginates with limit cap', async () => {
    for (let index = 0; index < 3; index += 1) {
      await pool.query(
        `INSERT INTO pty.clients (
           legal_name, normalized_tax_id, status
         ) VALUES ($1, $2, 'ACTIVE')`,
        [`PagTest Cliente ${index}`, `2234567800019${index}`],
      );
    }

    const page = await searchService.search(
      { identityId: identityA, sessionId: 's-4' },
      { q: 'PagTest', types: SEARCH_ENTITY_TYPES.Client, limit: '2', offset: '0' },
    );

    expect(page.groups[0]?.items.length ?? 0).toBeLessThanOrEqual(2);
    expect(page.pagination.limit).toBe(2);
  });
});
