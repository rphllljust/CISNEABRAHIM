/**
 * Contrato de tipos do módulo "Access Administration" (frontend).
 *
 * Estes tipos espelham exatamente o contrato da API
 * `/api/v1/authz/access-admin`. O frontend NÃO decide autoridade:
 * ele apenas envia os códigos escolhidos e exibe o que o servidor retorna.
 */

export type CapabilityKind = 'action' | 'sod' | 'access-admin';

export type CapabilityEntry = {
  code: string;
  kind: CapabilityKind;
  class?: 'ACCESS_ADMIN' | 'FINANCIAL_APPROVAL';
};

export type ScopeEntry = {
  code: string;
  anchored: boolean;
};

export type AccessRole = {
  id: string;
  code: string;
  label: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
};

export type RoleAssignment = {
  id: string;
  identityId: string;
  identityLogin: string | null;
  roleCode: string;
  roleLabel: string;
  scopeType: string;
  scopeAnchor: string | null;
  version: number;
  assignedAt: string;
  revokedAt: string | null;
};

export type SodConflict = {
  identityId: string;
  identityLogin: string | null;
  roleCodes: string[];
  rule: string;
  capabilityA: string;
  capabilityB: string;
  status: 'ACTIVE';
};

export const AccessAdminErrorCodes = {
  DENIED: 'AUTHZ_DENIED',
  NOT_FOUND: 'ACCESS_ADMIN_NOT_FOUND',
  CONFLICT: 'ACCESS_ADMIN_CONFLICT',
  VERSION_CONFLICT: 'ACCESS_ADMIN_VERSION_CONFLICT',
  SELF_ESCALATION: 'ACCESS_ADMIN_SELF_ESCALATION',
  ESCALATION: 'ACCESS_ADMIN_ESCALATION',
  SOD_CONFLICT: 'ACCESS_ADMIN_SOD_CONFLICT',
  VALIDATION_FAILED: 'AUTHZ_VALIDATION_FAILED',
} as const;
