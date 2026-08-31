import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { toResourceContextFromServiceRequest } from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';
import { serviceRequestsAccessDenied } from './service-requests-access.errors';

@Injectable()
export class ServiceRequestsAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string | undefined,
    unitId: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.RequestsServiceRequestCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw serviceRequestsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.RequestsServiceRequestCreate,
      AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === unitId) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && clientId && grant.resource_id === clientId) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw serviceRequestsAccessDenied();
    }
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    row: ServiceRequestRow,
  ): Promise<void> {
    const context = toResourceContextFromServiceRequest(row);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw serviceRequestsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === row.unit_id) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && row.client_id && grant.resource_id === row.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw serviceRequestsAccessDenied();
    }
  }

  async assertListAction(actor: IdentityAuthzContext): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.RequestsServiceRequestList,
        resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw serviceRequestsAccessDenied();
    }
  }

  async findListGrants(actor: IdentityAuthzContext) {
    await this.assertListAction(actor);
    return this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.RequestsServiceRequestList,
      AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
    );
  }
}
