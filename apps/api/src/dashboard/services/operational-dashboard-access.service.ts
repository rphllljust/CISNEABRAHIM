import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { DashboardVisibility } from '../domain/operational-dashboard';
import { DASHBOARD_ERROR_CODES } from '../errors/dashboard-error-codes';
import { DashboardHttpException } from '../errors/dashboard-http.exception';
import {
  OperationalDashboardRepository,
  type OperationalDashboardScopeFilters,
} from '../repositories/operational-dashboard.repository';
import { buildOperationalDashboardSnapshot } from '../serializers/operational-dashboard-response.serializer';

@Injectable()
export class OperationalDashboardAccessService {
  constructor(
    private readonly repository: OperationalDashboardRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async requireVisibility(actor: IdentityAuthzContext): Promise<DashboardVisibility> {
    const visibility = await this.resolveVisibility(actor);
    if (!Object.values(visibility).some(Boolean)) {
      throw new DashboardHttpException(403, DASHBOARD_ERROR_CODES.ACCESS_DENIED, 'Access denied.');
    }
    return visibility;
  }

  async getOperationalSnapshot(actor: IdentityAuthzContext) {
    const visibility = await this.requireVisibility(actor);

    const scopes = await this.resolveScopeFilters(actor, visibility);
    const counts = await this.repository.countOperationalMetrics(visibility, scopes);

    return buildOperationalDashboardSnapshot({
      generatedAt: new Date().toISOString(),
      visibility,
      counts,
    });
  }

  private async resolveVisibility(actor: IdentityAuthzContext): Promise<DashboardVisibility> {
    const [serviceRequests, serviceOrders, measurements, billing, documents, resources] =
      await Promise.all([
        this.isAllowed(actor, AUTHZ_ACTIONS.RequestsServiceRequestList, AUTHZ_RESOURCE_TYPES.RequestsServiceRequest),
        this.isAllowed(actor, AUTHZ_ACTIONS.ServiceOrdersServiceOrderList, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
        this.isAllowed(actor, AUTHZ_ACTIONS.MeasurementsMeasurementRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
        this.isAllowed(actor, AUTHZ_ACTIONS.BillingBillingRecordRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
        this.isAllowed(actor, AUTHZ_ACTIONS.DocumentsDocumentList, AUTHZ_RESOURCE_TYPES.DocumentsDocument),
        this.isAllowed(
          actor,
          AUTHZ_ACTIONS.ServiceOrdersResourceAllocationRead,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        ),
      ]);

    return {
      serviceRequests,
      serviceOrders,
      measurements,
      billing,
      documents,
      resources,
    };
  }

  private async resolveScopeFilters(
    actor: IdentityAuthzContext,
    visibility: DashboardVisibility,
  ): Promise<OperationalDashboardScopeFilters> {
    const serviceRequestScope = visibility.serviceRequests
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.RequestsServiceRequestList, AUTHZ_RESOURCE_TYPES.RequestsServiceRequest)
      : null;
    const serviceOrderScope = visibility.serviceOrders
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.ServiceOrdersServiceOrderList, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder)
      : null;
    const measurementScope = visibility.measurements
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.MeasurementsMeasurementRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder, 'so')
      : null;
    const billingScope = visibility.billing
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.BillingBillingRecordRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder, 'br')
      : null;
    const documentScope = visibility.documents
      ? await this.scopeFor(actor, AUTHZ_ACTIONS.DocumentsDocumentList, AUTHZ_RESOURCE_TYPES.DocumentsDocument, 'd')
      : null;
    const resourceScope = visibility.resources
      ? await this.scopeFor(
          actor,
          AUTHZ_ACTIONS.ServiceOrdersResourceAllocationRead,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
          'so',
        )
      : null;

    return {
      serviceRequestScope,
      serviceOrderScope,
      measurementScope,
      billingScope,
      documentScope,
      resourceScope,
    };
  }

  private async scopeFor(
    actor: IdentityAuthzContext,
    action: (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS],
    resourceType: (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES],
    alias?: 'so' | 'br' | 'd',
  ) {
    const grants = await this.authorizationRepository.findActiveGrants(actor.identityId, action, resourceType);
    if (resourceType === AUTHZ_RESOURCE_TYPES.DocumentsDocument) {
      const predicate = this.scopeEnforcement.buildDocumentListFilter(grants);
      return alias ? this.prefixAlias(predicate, alias) : predicate;
    }
    const predicate =
      resourceType === AUTHZ_RESOURCE_TYPES.RequestsServiceRequest
        ? this.scopeEnforcement.buildServiceRequestListFilter(grants)
        : this.scopeEnforcement.buildServiceOrderListFilter(grants);
    return alias ? this.prefixAlias(predicate, alias) : predicate;
  }

  private prefixAlias(predicate: { clause: string; params: unknown[] }, alias: string) {
    if (predicate.clause === 'TRUE') {
      return predicate;
    }
    if (predicate.clause === 'FALSE') {
      return predicate;
    }
    const clause = predicate.clause
      .replace(/\bunit_id\b/g, `${alias}.unit_id`)
      .replace(/\bclient_id\b/g, `${alias}.client_id`);
    return { clause, params: predicate.params };
  }

  private async isAllowed(
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
