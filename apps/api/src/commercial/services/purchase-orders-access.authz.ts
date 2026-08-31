import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { assertPolicyAndGrantScope } from '../../authorization/services/domain-grant-authz.helper';
import { toResourceContextFromPurchaseOrder } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { PurchaseOrderRow } from '../repositories/purchase-orders.repository.types';
import { purchaseOrdersAccessDenied } from './purchase-orders-access.errors';

@Injectable()
export class PurchaseOrdersAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  private get deps() {
    return {
      authorizationRepository: this.authorizationRepository,
      policyDecisionPoint: this.policyDecisionPoint,
    };
  }

  async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string,
    unitId: string,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action: AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      context: { clientId, unitId },
      onDenied: purchaseOrdersAccessDenied,
    });
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    purchaseOrder: PurchaseOrderRow,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      context: toResourceContextFromPurchaseOrder(purchaseOrder),
      onDenied: purchaseOrdersAccessDenied,
    });
  }

  async buildListScopeFilter(actor: IdentityAuthzContext): Promise<{
    clause: string;
    params: unknown[];
  }> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action: AUTHZ_ACTIONS.CommercialPurchaseOrderList,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      onDenied: purchaseOrdersAccessDenied,
    });

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderList,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    return this.scopeEnforcement.buildPurchaseOrderListFilter(grants);
  }
}
