import type { GrantRow } from '../repositories/authorization.repository';

export type GrantResponseV1 = {
  id: string;
  identityId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  scopeType: string;
  version: number;
  validFrom: string;
  validUntil: string | null;
  revokedAt: string | null;
};

export function toGrantResponse(grant: GrantRow): GrantResponseV1 {
  return {
    id: grant.id,
    identityId: grant.identity_id,
    action: grant.action,
    resourceType: grant.resource_type,
    resourceId: grant.resource_id,
    scopeType: grant.scope_type,
    version: grant.version,
    validFrom: grant.valid_from,
    validUntil: grant.valid_until,
    revokedAt: grant.revoked_at,
  };
}
