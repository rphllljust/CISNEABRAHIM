import type {
  AccessAssignmentRow,
  AccessRoleRow,
} from '../repositories/access-admin.repository';
import type { AccessAdminCapabilityCatalogEntry } from '../domain/access-admin-rules';

export type AccessRoleResponseV1 = {
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

export type AccessAssignmentResponseV1 = {
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

export type AccessAdminSodConflictResponseV1 = {
  identityId: string;
  identityLogin: string | null;
  roleCodes: string[];
  rule: string;
  capabilityA: string;
  capabilityB: string;
  status: 'ACTIVE';
};

export function toAccessRoleResponse(
  role: AccessRoleRow,
  capabilities: string[],
): AccessRoleResponseV1 {
  return {
    id: role.id,
    code: role.code,
    label: role.label,
    description: role.description,
    status: role.status,
    version: role.version,
    capabilities,
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  };
}

export function toAccessAssignmentResponse(
  row: AccessAssignmentRow,
): AccessAssignmentResponseV1 {
  return {
    id: row.id,
    identityId: row.identity_id,
    identityLogin: row.identity_login,
    roleCode: row.role_code,
    roleLabel: row.role_label,
    scopeType: row.scope_type,
    scopeAnchor: row.scope_anchor,
    version: row.version,
    assignedAt: row.assigned_at,
    revokedAt: row.revoked_at,
  };
}

export function toCatalogResponse(entries: AccessAdminCapabilityCatalogEntry[], scopes: { code: string; anchored: boolean }[]) {
  return { capabilities: entries, scopes };
}
