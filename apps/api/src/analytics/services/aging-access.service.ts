import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { parseAgingBucketPolicyFromEnv } from '../domain/aging-bucket.policy';
import { resolveBusinessTimezone } from '../domain/business-timezone';
import { resolveApproachingDueThresholdDays } from '../domain/aging-snapshot';
import { ANALYTICS_ERROR_CODES } from '../errors/analytics-error-codes';
import { AnalyticsHttpException } from '../errors/analytics-http.exception';
import { prefixScopeAlias } from '../repositories/aging-scope';
import { AgingReadModelRepository } from '../repositories/aging-read-model.repository';
import type { AgingScopeFilters } from '../repositories/aging-scope';
import type { AgingVisibility } from '../domain/aging-snapshot';
import { buildAgingSnapshot } from '../serializers/aging-response.serializer';

@Injectable()
export class AgingAccessService {
  constructor(
    private readonly repository: AgingReadModelRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async getAgingSnapshot(actor: IdentityAuthzContext) {
    const visibility = await this.resolveVisibility(actor);
    if (!Object.values(visibility).some(Boolean)) {
      throw new AnalyticsHttpException(403, ANALYTICS_ERROR_CODES.ACCESS_DENIED, 'Access denied.');
    }

    const scopes = await this.resolveScopeFilters(actor, visibility);
    const businessTimezone = resolveBusinessTimezone();
    const approachingDueThresholdDays = resolveApproachingDueThresholdDays();
    const counts = await this.repository.loadAgingCounts(visibility, scopes, {
      approachingDueThresholdDays,
      businessTimezone,
    });

    return buildAgingSnapshot({
      generatedAt: new Date().toISOString(),
      businessTimezone,
      approachingDueThresholdDays,
      bucketPolicy: parseAgingBucketPolicyFromEnv(),
      visibility,
      counts,
    });
  }

  private async resolveVisibility(actor: IdentityAuthzContext): Promise<AgingVisibility> {
    const [serviceRequests, serviceOrders, measurements, billing] = await Promise.all([
      this.hasGrant(actor, AUTHZ_ACTIONS.RequestsServiceRequestList, AUTHZ_RESOURCE_TYPES.RequestsServiceRequest),
      this.hasGrant(actor, AUTHZ_ACTIONS.ServiceOrdersServiceOrderList, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
      this.hasGrant(actor, AUTHZ_ACTIONS.MeasurementsMeasurementRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
      this.hasGrant(actor, AUTHZ_ACTIONS.BillingBillingRecordRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
    ]);

    return { serviceRequests, serviceOrders, measurements, billing };
  }

  private async resolveScopeFilters(
    actor: IdentityAuthzContext,
    visibility: AgingVisibility,
  ): Promise<AgingScopeFilters> {
    const serviceRequestScope = visibility.serviceRequests
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.RequestsServiceRequestList, AUTHZ_RESOURCE_TYPES.RequestsServiceRequest)
      : null;
    const serviceOrderScope = visibility.serviceOrders
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.ServiceOrdersServiceOrderList, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder)
      : null;
    const measurementScope = visibility.measurements
      ? await this.scopeFor(
          actor,
          AUTHZ_ACTIONS.MeasurementsMeasurementRead,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
          'so',
        )
      : null;
    const billingRecordScope = visibility.billing
      ? await this.scopeFor(
          actor,
          AUTHZ_ACTIONS.BillingBillingRecordRead,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
          'br',
        )
      : null;
    const billingDocumentScope = visibility.billing
      ? await this.scopeFor(
          actor,
          AUTHZ_ACTIONS.BillingBillingRecordRead,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
          'bd',
        )
      : null;

    return {
      serviceRequestScope,
      serviceOrderScope,
      measurementScope,
      billingRecordScope,
      billingDocumentScope,
    };
  }

  private async scopeFor(
    actor: IdentityAuthzContext,
    action: (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS],
    resourceType: (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES],
    alias?: 'so' | 'bd' | 'br',
  ) {
    const grants = await this.authorizationRepository.findActiveGrants(actor.identityId, action, resourceType);
    const predicate =
      resourceType === AUTHZ_RESOURCE_TYPES.RequestsServiceRequest
        ? this.scopeEnforcement.buildServiceRequestListFilter(grants)
        : this.scopeEnforcement.buildServiceOrderListFilter(grants);
    return alias ? prefixScopeAlias(predicate, alias) : predicate;
  }

  private async hasGrant(
    actor: IdentityAuthzContext,
    action: (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS],
    resourceType: (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES],
  ): Promise<boolean> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      resourceType,
    );
    return grants.length > 0;
  }
}
