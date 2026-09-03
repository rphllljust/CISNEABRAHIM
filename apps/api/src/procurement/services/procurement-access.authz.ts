import { Injectable } from '@nestjs/common';
import { assertPolicyAndGrantScope } from '../../authorization/services/domain-grant-authz.helper';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { procurementAccessDenied } from './procurement-access.errors';

@Injectable()
export class ProcurementAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertProcurementAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    resource: { id: string },
  ): Promise<void> {
    await assertPolicyAndGrantScope(
      {
        authorizationRepository: this.authorizationRepository,
        policyDecisionPoint: this.policyDecisionPoint,
      },
      {
        actor,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.Procurement,
        context: { resourceId: resource.id },
        onDenied: procurementAccessDenied,
      },
    );
  }
}
