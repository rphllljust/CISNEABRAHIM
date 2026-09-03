import { Injectable } from '@nestjs/common';
import { toResourceContextFromAccounting } from '../../authorization/scope/scope-matcher';
import { assertPolicyAndGrantScope } from '../../authorization/services/domain-grant-authz.helper';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { inventoryAccessDenied } from './inventory-access.errors';

@Injectable()
export class InventoryAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertInventoryAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    resource: { id: string; unitId: string },
  ): Promise<void> {
    await assertPolicyAndGrantScope(
      {
        authorizationRepository: this.authorizationRepository,
        policyDecisionPoint: this.policyDecisionPoint,
      },
      {
        actor,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.InventoryStock,
        context: toResourceContextFromAccounting(resource),
        onDenied: inventoryAccessDenied,
      },
    );
  }
}
