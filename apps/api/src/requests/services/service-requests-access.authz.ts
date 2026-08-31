import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { assertPolicyAndGrantScope } from '../../authorization/services/domain-grant-authz.helper';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { toResourceContextFromServiceRequest } from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';
import { serviceRequestsAccessDenied } from './service-requests-access.errors';

@Injectable()
export class ServiceRequestsAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  private get deps() {
    return {
      authorizationRepository: this.authorizationRepository,
      policyDecisionPoint: this.policyDecisionPoint,
    };
  }

  async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string | undefined,
    unitId: string,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action: AUTHZ_ACTIONS.RequestsServiceRequestCreate,
      resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      context: { clientId: clientId ?? undefined, unitId },
      onDenied: serviceRequestsAccessDenied,
    });
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    row: ServiceRequestRow,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      context: toResourceContextFromServiceRequest(row),
      onDenied: serviceRequestsAccessDenied,
    });
  }

  async assertListAction(actor: IdentityAuthzContext): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action: AUTHZ_ACTIONS.RequestsServiceRequestList,
      resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      onDenied: serviceRequestsAccessDenied,
    });
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
