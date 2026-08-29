/**
 * Escopos de acesso contextual (AUTHZ-SCOPE-001 / Prompt 23).
 * Sem multitenancy presumido — âncoras explícitas via resource_id.
 */
export const AUTHZ_SCOPES = {
  Own: 'OWN',
  Assigned: 'ASSIGNED',
  Unit: 'UNIT',
  Client: 'CLIENT',
  Contract: 'CONTRACT',
  Document: 'DOCUMENT',
  Financial: 'FINANCIAL',
  Global: 'GLOBAL',
  Platform: 'PLATFORM',
} as const;

export type AuthzScopeType = (typeof AUTHZ_SCOPES)[keyof typeof AUTHZ_SCOPES];

const SCOPE_SET = new Set<string>(Object.values(AUTHZ_SCOPES));

export function isAuthzScopeType(value: string): value is AuthzScopeType {
  return SCOPE_SET.has(value);
}

/** Escopos que exigem âncora registrada em scope_refs e resource_id na concessão. */
export const ANCHORED_SCOPE_TYPES = new Set<AuthzScopeType>([
  AUTHZ_SCOPES.Unit,
  AUTHZ_SCOPES.Client,
  AUTHZ_SCOPES.Contract,
  AUTHZ_SCOPES.Document,
  AUTHZ_SCOPES.Financial,
]);

/** Contexto do recurso avaliado — nunca confiar em valores vindos do cliente sem validar no backend. */
export type AuthzResourceContext = {
  resourceId?: string;
  ownerIdentityId?: string;
  assignedIdentityId?: string;
  unitId?: string;
  clientId?: string;
  contractId?: string;
  documentId?: string;
  isFinancial?: boolean;
};

/** @deprecated use AuthzResourceContext */
export type AuthzRequestContext = AuthzResourceContext;

export type EffectiveScopeGrant = {
  scopeType: AuthzScopeType;
  resourceId: string | null;
};
