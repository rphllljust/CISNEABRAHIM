import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { catalogAccessDenied } from './service-catalog-access.errors';

@Injectable()
export class ServiceCatalogAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertGlobalAction(actor: IdentityAuthzContext, action: AuthzAction): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CatalogService },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw catalogAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CatalogService,
    );
    const hasGlobal = grants.some(
      (grant) => grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null,
    );
    if (!hasGlobal) {
      throw catalogAccessDenied();
    }
  }

  async assertListAction(actor: IdentityAuthzContext): Promise<void> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CatalogServiceList,
      AUTHZ_RESOURCE_TYPES.CatalogService,
    );
    if (grants.length === 0) {
      throw catalogAccessDenied();
    }
    const hasGlobal = grants.some(
      (grant) => grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null,
    );
    if (!hasGlobal) {
      throw catalogAccessDenied();
    }
  }
}
