import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { toResourceContextFromPurchaseOrder } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { PurchaseOrderRow } from '../repositories/purchase-orders.repository.types';
import { purchaseOrdersAccessDenied } from './purchase-orders-access.errors';

@Injectable()
export class PurchaseOrdersAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string,
    unitId: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw purchaseOrdersAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === unitId) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === clientId) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw purchaseOrdersAccessDenied();
    }
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    purchaseOrder: PurchaseOrderRow,
  ): Promise<void> {
    const context = toResourceContextFromPurchaseOrder(purchaseOrder);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw purchaseOrdersAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === purchaseOrder.unit_id) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === purchaseOrder.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw purchaseOrdersAccessDenied();
    }
  }

  async buildListScopeFilter(actor: IdentityAuthzContext): Promise<{
    clause: string;
    params: unknown[];
  }> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialPurchaseOrderList,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw purchaseOrdersAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderList,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    return this.scopeEnforcement.buildPurchaseOrderListFilter(grants);
  }
}
