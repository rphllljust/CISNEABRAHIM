import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { MEASUREMENT_MODEL_POLICIES } from '../domain/measurement-model';
import { PRICING_MODEL_POLICIES } from '../domain/pricing-model';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';

@Injectable()
export class CommercialPoliciesAccessService {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async listPricingModels(actor: IdentityAuthzContext) {
    await this.assertRead(actor);
    return { items: PRICING_MODEL_POLICIES };
  }

  async listMeasurementModels(actor: IdentityAuthzContext) {
    await this.assertRead(actor);
    return { items: MEASUREMENT_MODEL_POLICIES };
  }

  private async assertRead(actor: IdentityAuthzContext): Promise<void> {
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CommercialPolicyRead);
  }

  private async assertGlobalAction(actor: IdentityAuthzContext, action: AuthzAction): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CommercialPolicy },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CommercialPolicy,
    );
    const hasGlobal = grants.some(
      (grant) => grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null,
    );
    if (!hasGlobal) {
      throw this.denied();
    }
  }

  private denied(): CommercialHttpException {
    return new CommercialHttpException(HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.');
  }
}
