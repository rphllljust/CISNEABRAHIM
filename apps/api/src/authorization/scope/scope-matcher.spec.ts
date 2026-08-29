import { describe, expect, it } from 'vitest';
import { grantMatchesResourceContext } from '../scope/scope-matcher';
import { AUTHZ_SCOPES } from '../types/authz-scopes';

describe('grantMatchesResourceContext', () => {
  const identityId = '11111111-1111-4111-8111-111111111111';

  it('denies GLOBAL when resource_id is set (no implicit global)', () => {
    const matched = grantMatchesResourceContext({
      grant: { scope_type: 'GLOBAL', resource_id: 'anchor', resource_type: 'authz:scoped-record' },
      identityId,
      context: { resourceId: 'rec-1', unitId: 'unit-a' },
    });
    expect(matched).toBe(false);
  });

  it('allows UNIT only for matching unitId', () => {
    const allow = grantMatchesResourceContext({
      grant: { scope_type: AUTHZ_SCOPES.Unit, resource_id: 'unit-a', resource_type: 'authz:scoped-record' },
      identityId,
      context: { unitId: 'unit-a', resourceId: 'rec-1' },
    });
    const deny = grantMatchesResourceContext({
      grant: { scope_type: AUTHZ_SCOPES.Unit, resource_id: 'unit-a', resource_type: 'authz:scoped-record' },
      identityId,
      context: { unitId: 'unit-b', resourceId: 'rec-2' },
    });
    expect(allow).toBe(true);
    expect(deny).toBe(false);
  });

  it('allows ASSIGNED only for assigned identity', () => {
    const allow = grantMatchesResourceContext({
      grant: { scope_type: AUTHZ_SCOPES.Assigned, resource_id: null, resource_type: 'authz:scoped-record' },
      identityId,
      context: { assignedIdentityId: identityId, resourceId: 'rec-1' },
    });
    const deny = grantMatchesResourceContext({
      grant: { scope_type: AUTHZ_SCOPES.Assigned, resource_id: null, resource_type: 'authz:scoped-record' },
      identityId,
      context: { assignedIdentityId: 'other', resourceId: 'rec-1' },
    });
    expect(allow).toBe(true);
    expect(deny).toBe(false);
  });

  it('allows FINANCIAL only for financial records in contract anchor', () => {
    const allow = grantMatchesResourceContext({
      grant: {
        scope_type: AUTHZ_SCOPES.Financial,
        resource_id: 'contract-1',
        resource_type: 'authz:scoped-record',
      },
      identityId,
      context: {
        isFinancial: true,
        contractId: 'contract-1',
        resourceId: 'rec-1',
      },
    });
    const deny = grantMatchesResourceContext({
      grant: {
        scope_type: AUTHZ_SCOPES.Financial,
        resource_id: 'contract-1',
        resource_type: 'authz:scoped-record',
      },
      identityId,
      context: {
        isFinancial: false,
        contractId: 'contract-1',
        resourceId: 'rec-2',
      },
    });
    expect(allow).toBe(true);
    expect(deny).toBe(false);
  });
});
