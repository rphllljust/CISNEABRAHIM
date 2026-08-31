import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { toResourceContextFromServiceOrder } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { ServiceOrderRow } from '../../service-orders/repositories/service-orders.repository.types';
import { measurementsAccessDenied } from './measurements-access.errors';

@Injectable()
export class MeasurementsAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertServiceOrderAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    row: ServiceOrderRow,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        context: toResourceContextFromServiceOrder(row),
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw measurementsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === row.unit_id) {
        return true;
      }
      if (row.client_id && grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === row.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw measurementsAccessDenied();
    }
  }
}
