import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { resolveBusinessTimezone } from '../domain/business-timezone';
import {
  PRODUCTIVITY_PERIOD_PRESETS,
  type ProductivityPeriodPreset,
  ProductivityPeriodValidationError,
  resolveProductivityPeriod,
} from '../domain/productivity-period';
import { ANALYTICS_ERROR_CODES } from '../errors/analytics-error-codes';
import { AnalyticsHttpException } from '../errors/analytics-http.exception';
import { prefixScopeAlias } from '../repositories/aging-scope';
import { OperationalProfitabilityReadModelRepository } from '../repositories/operational-profitability-read-model.repository';
import {
  buildOperationalProfitabilitySnapshot,
  parseProfitabilityGroupBy,
} from '../serializers/operational-profitability-response.serializer';

export type OperationalProfitabilityQuery = {
  period?: string;
  from?: string;
  to?: string;
  groupBy?: string;
  unitId?: string;
  serviceType?: string;
  serviceOrderId?: string;
  clientId?: string;
  contractReference?: string;
};

@Injectable()
export class OperationalProfitabilityAccessService {
  constructor(
    private readonly repository: OperationalProfitabilityReadModelRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async getOperationalProfitabilitySnapshot(
    actor: IdentityAuthzContext,
    query: OperationalProfitabilityQuery,
  ) {
    const visibility = await this.resolveVisibility(actor);
    if (!visibility.revenue && !visibility.costs) {
      throw new AnalyticsHttpException(403, ANALYTICS_ERROR_CODES.ACCESS_DENIED, 'Access denied.');
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    const serviceOrderScope = prefixScopeAlias(
      this.scopeEnforcement.buildServiceOrderListFilter(grants),
      'ord',
    );

    const businessTimezone = resolveBusinessTimezone();
    const periodPreset = parsePeriodPreset(query.period);
    const groupBy = parseProfitabilityGroupBy(query.groupBy);

    let period;
    try {
      period = resolveProductivityPeriod({
        preset: periodPreset,
        customFrom: query.from,
        customTo: query.to,
        businessTimezone,
      });
    } catch (error) {
      if (error instanceof ProductivityPeriodValidationError) {
        throw new AnalyticsHttpException(400, ANALYTICS_ERROR_CODES.INVALID_PERIOD, 'Invalid period.');
      }
      throw error;
    }

    const rows = await this.repository.loadServiceOrderProfitabilityRows({
      fromInclusive: period.fromInclusive,
      toExclusive: period.toExclusive,
      serviceOrderScope,
      includeRevenue: visibility.revenue,
      includeCosts: visibility.costs,
      serviceOrderId: query.serviceOrderId?.trim() || undefined,
      clientId: query.clientId?.trim() || undefined,
      contractReference: query.contractReference?.trim() || undefined,
      unitFilter: query.unitId?.trim() || undefined,
      serviceTypeFilter: query.serviceType?.trim() || undefined,
    });

    return buildOperationalProfitabilitySnapshot({
      generatedAt: new Date().toISOString(),
      period,
      groupBy,
      visibility,
      rows,
    });
  }

  private async resolveVisibility(actor: IdentityAuthzContext) {
    const [revenue, costs] = await Promise.all([
      this.hasGrant(
        actor,
        AUTHZ_ACTIONS.MeasurementsMeasurementRead,
        AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      ),
      this.hasGrant(
        actor,
        AUTHZ_ACTIONS.ServiceOrdersOperationalCostRead,
        AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      ),
    ]);

    return { revenue, costs };
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

function parsePeriodPreset(value: string | undefined): ProductivityPeriodPreset {
  const normalized = value?.trim().toLowerCase();
  if (normalized === PRODUCTIVITY_PERIOD_PRESETS.Week) {
    return PRODUCTIVITY_PERIOD_PRESETS.Week;
  }
  if (normalized === PRODUCTIVITY_PERIOD_PRESETS.Month) {
    return PRODUCTIVITY_PERIOD_PRESETS.Month;
  }
  if (normalized === PRODUCTIVITY_PERIOD_PRESETS.Custom) {
    return PRODUCTIVITY_PERIOD_PRESETS.Custom;
  }
  return PRODUCTIVITY_PERIOD_PRESETS.Today;
}
