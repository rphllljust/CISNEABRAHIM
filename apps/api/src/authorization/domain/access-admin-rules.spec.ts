import { describe, expect, it } from 'vitest';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_SCOPES, type AuthzScopeType } from '../types/authz-scopes';
import { SOD_CAPABILITIES } from './segregation-of-duties';
import {
  AccessAdminRuleError,
  ACCESS_ADMIN_CAPABILITIES,
  assertAccessRoleCode,
  assertAssignableScope,
  assertNoSodConflict,
  assertRoleCapabilities,
  assertExpectedVersion,
  buildCapabilityCatalog,
  capabilityClassOf,
  findSodConflicts,
  isAnchoredScope,
  scopeCovers,
} from './access-admin-rules';

describe('access-admin-rules (pure domain)', () => {
  it('requires functional UPPER_SNAKE role codes (no spaces, accents or lowercase)', () => {
    // Sintaxe impede 'Maria Silva', 'MARIA-SILVA' e 'maria'. UPPER_SNAKE como
    // 'MARIA_SILVA' e sintaticamente valido: impedir nome de pessoa e' politica
    // de nomeacao (codigo funcional), nao regex.
    expect(() => assertAccessRoleCode('MARIA_SILVA')).not.toThrow();
    expect(() => assertAccessRoleCode('Maria Silva')).toThrow(AccessAdminRuleError);
    expect(() => assertAccessRoleCode('MARIA-SILVA')).toThrow(AccessAdminRuleError);
    expect(() => assertAccessRoleCode('maria')).toThrow(AccessAdminRuleError);
    expect(() => assertAccessRoleCode('AB')).toThrow(AccessAdminRuleError);
    expect(() => assertAccessRoleCode('ACCESS_OPERATOR')).not.toThrow();
  });

  it('rejects capabilities outside the server catalog (no client-defined capability)', () => {
    expect(() => assertRoleCapabilities(['totally:invented:capability'])).toThrow(
      AccessAdminRuleError,
    );
    expect(() => assertRoleCapabilities([AUTHZ_ACTIONS.ClientRead])).not.toThrow();
    expect(() => assertRoleCapabilities([SOD_CAPABILITIES.PurchaseApprove])).not.toThrow();
    expect(() => assertRoleCapabilities(['purchase.approve', 'purchase.approve'])).toThrow(
      AccessAdminRuleError,
    );
  });

  it('builds a server-side capability catalog with access classes', () => {
    const catalog = buildCapabilityCatalog();
    const codes = new Set(catalog.map((entry) => entry.code));
    expect(codes.has(AUTHZ_ACTIONS.AccessAdminManage)).toBe(true);
    expect(codes.has(AUTHZ_ACTIONS.ClientRead)).toBe(true);
    expect(codes.has(SOD_CAPABILITIES.PurchaseApprove)).toBe(true);
    expect(codes.size).toBe(catalog.length);
    expect(capabilityClassOf(AUTHZ_ACTIONS.AccessAdminManage)).toBe('ACCESS_ADMIN');
    expect(capabilityClassOf(AUTHZ_ACTIONS.GrantCreate)).toBe('ACCESS_ADMIN');
    expect(capabilityClassOf(SOD_CAPABILITIES.PurchaseApprove)).toBe('FINANCIAL_APPROVAL');
    expect(capabilityClassOf(AUTHZ_ACTIONS.ClientRead)).toBeUndefined();
    // As classes jamais se sobrepoem.
    for (const code of ACCESS_ADMIN_CAPABILITIES) {
      expect(capabilityClassOf(code)).toBe('ACCESS_ADMIN');
    }
  });

  it('validates assignable scopes and anchored requirements', () => {
    expect(assertAssignableScope(AUTHZ_SCOPES.Global)).toBe(AUTHZ_SCOPES.Global);
    expect(assertAssignableScope(AUTHZ_SCOPES.Unit)).toBe(AUTHZ_SCOPES.Unit);
    expect(() => assertAssignableScope('MOON')).toThrow(AccessAdminRuleError);
    expect(() => assertAssignableScope(AUTHZ_SCOPES.Own)).toThrow(AccessAdminRuleError);
    expect(isAnchoredScope(AUTHZ_SCOPES.Unit)).toBe(true);
    expect(isAnchoredScope(AUTHZ_SCOPES.Global)).toBe(false);
  });

  it('scope coverage: GLOBAL covers everything; equal anchors cover; distinct anchors do not', () => {
    const global: { scopeType: AuthzScopeType; scopeAnchor: string | null } = {
      scopeType: AUTHZ_SCOPES.Global,
      scopeAnchor: null,
    };
    const unitA: { scopeType: AuthzScopeType; scopeAnchor: string | null } = {
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: 'unit-a',
    };
    const unitB: { scopeType: AuthzScopeType; scopeAnchor: string | null } = {
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: 'unit-b',
    };
    expect(scopeCovers(global, unitA)).toBe(true);
    expect(scopeCovers(unitA, global)).toBe(false);
    expect(scopeCovers(unitA, unitA)).toBe(true);
    expect(scopeCovers(unitA, unitB)).toBe(false);
  });

  it('detects the critical SOD-007 configuration conflict (access-admin x financial approval)', () => {
    expect(
      findSodConflicts([
        {
          capability: AUTHZ_ACTIONS.AccessAdminManage,
          scopeType: AUTHZ_SCOPES.Global,
          scopeAnchor: null,
        },
        {
          capability: SOD_CAPABILITIES.PurchaseApprove,
          scopeType: AUTHZ_SCOPES.Global,
          scopeAnchor: null,
        },
      ]),
    ).toHaveLength(1);
    expect(() =>
      assertNoSodConflict([
        {
          capability: AUTHZ_ACTIONS.AccessAdminManage,
          scopeType: AUTHZ_SCOPES.Unit,
          scopeAnchor: 'unit-a',
        },
        {
          capability: SOD_CAPABILITIES.PurchaseApprove,
          scopeType: AUTHZ_SCOPES.Unit,
          scopeAnchor: 'unit-b',
        },
      ]),
    ).not.toThrow();
  });

  it('enforces a positive expectedVersion (optimistic concurrency)', () => {
    expect(() => assertExpectedVersion(2)).not.toThrow();
    expect(() => assertExpectedVersion(0)).toThrow(AccessAdminRuleError);
    expect(() => assertExpectedVersion(undefined)).toThrow(AccessAdminRuleError);
    expect(() => assertExpectedVersion(1.5)).toThrow(AccessAdminRuleError);
  });
});
