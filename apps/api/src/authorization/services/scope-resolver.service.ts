import { Injectable } from '@nestjs/common';
import type { GrantRow } from '../repositories/authorization.repository';
import { grantMatchesResourceContext } from '../scope/scope-matcher';
import type { AuthzResourceContext, EffectiveScopeGrant } from '../types/authz-scopes';

@Injectable()
export class ScopeResolverService {
  resolveEffectiveGrants(
    grants: GrantRow[],
    identityId: string,
    context?: AuthzResourceContext,
  ): EffectiveScopeGrant[] {
    return grants
      .filter((grant) =>
        grantMatchesResourceContext({
          grant,
          identityId,
          context,
        }),
      )
      .map((grant) => ({
        scopeType: grant.scope_type,
        resourceId: grant.resource_id,
      }));
  }

  hasEffectiveAccess(
    grants: GrantRow[],
    identityId: string,
    context?: AuthzResourceContext,
  ): boolean {
    return this.resolveEffectiveGrants(grants, identityId, context).length > 0;
  }
}
