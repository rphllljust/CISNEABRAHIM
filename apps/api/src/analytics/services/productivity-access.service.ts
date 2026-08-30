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
import { PRODUCTIVITY_GROUP_BY, type ProductivityGroupBy } from '../domain/productivity-summary';
import { ANALYTICS_ERROR_CODES } from '../errors/analytics-error-codes';
import { AnalyticsHttpException } from '../errors/analytics-http.exception';
import { prefixScopeAlias } from '../repositories/aging-scope';
import { ProductivityReadModelRepository } from '../repositories/productivity-read-model.repository';
import { buildProductivitySnapshot } from '../serializers/productivity-response.serializer';

export type ProductivityQuery = {
  period?: string;
  from?: string;
  to?: string;
  groupBy?: string;
  unitId?: string;
  archetype?: string;
};

@Injectable()
export class ProductivityAccessService {
  constructor(
    private readonly repository: ProductivityReadModelRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async getProductivitySnapshot(actor: IdentityAuthzContext, query: ProductivityQuery) {
    const visibility = await this.resolveVisibility(actor);
    if (!visibility.serviceOrders && !visibility.measurements) {
      throw new AnalyticsHttpException(403, ANALYTICS_ERROR_CODES.ACCESS_DENIED, 'Access denied.');
    }

    const businessTimezone = resolveBusinessTimezone();
    const periodPreset = parsePeriodPreset(query.period);
    const groupBy = parseGroupBy(query.groupBy);

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

    const serviceOrderScope = visibility.serviceOrders
      ? await this.scopeFor(
          actor,
          AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        )
      : null;
    const measurementScope = visibility.measurements
      ? await this.scopeFor(
          actor,
          AUTHZ_ACTIONS.MeasurementsMeasurementRead,
          AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
          'so',
        )
      : null;

    const { overall, groups } = await this.repository.loadProductivityAggregates({
      fromInclusive: period.fromInclusive,
      toExclusive: period.toExclusive,
      serviceOrderScope,
      measurementScope,
      groupBy,
      unitFilter: query.unitId?.trim() || undefined,
      archetypeFilter: query.archetype?.trim() || undefined,
    });

    const snapshot = buildProductivitySnapshot({
      generatedAt: new Date().toISOString(),
      period,
      groupBy,
      visibility,
      overall: maskAggregatesForVisibility(overall, visibility),
      groups: groups.map((group) => ({
        groupKey: group.groupKey,
        groupLabel: group.groupLabel,
        aggregates: maskAggregatesForVisibility(group.aggregates, visibility),
      })),
    });

    return snapshot;
  }

  private async resolveVisibility(actor: IdentityAuthzContext) {
    const [serviceOrders, measurements, resources] = await Promise.all([
      this.hasGrant(actor, AUTHZ_ACTIONS.ServiceOrdersServiceOrderList, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
      this.hasGrant(actor, AUTHZ_ACTIONS.MeasurementsMeasurementRead, AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder),
      this.hasGrant(
        actor,
        AUTHZ_ACTIONS.ServiceOrdersResourceAllocationRead,
        AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      ),
    ]);

    return { serviceOrders, measurements, resources };
  }

  private async scopeFor(
    actor: IdentityAuthzContext,
    action: (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS],
    resourceType: (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES],
    alias?: 'so',
  ) {
    const grants = await this.authorizationRepository.findActiveGrants(actor.identityId, action, resourceType);
    const predicate = this.scopeEnforcement.buildServiceOrderListFilter(grants);
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

function parseGroupBy(value: string | undefined): ProductivityGroupBy {
  const normalized = value?.trim().toLowerCase();
  if (normalized === PRODUCTIVITY_GROUP_BY.Unit) {
    return PRODUCTIVITY_GROUP_BY.Unit;
  }
  if (normalized === PRODUCTIVITY_GROUP_BY.Archetype) {
    return PRODUCTIVITY_GROUP_BY.Archetype;
  }
  return PRODUCTIVITY_GROUP_BY.None;
}

function maskAggregatesForVisibility(
  aggregates: Parameters<typeof buildProductivitySnapshot>[0]['overall'],
  visibility: { serviceOrders: boolean; measurements: boolean; resources: boolean },
) {
  if (!visibility.serviceOrders) {
    return {
      ...aggregates,
      completed: 0,
      onTimeNumerator: 0,
      onTimeDenominator: 0,
      cycleTimeTotalHours: null,
      cycleTimeSampleSize: 0,
      evidenceNumerator: 0,
      evidenceDenominator: 0,
      utilizationNumeratorSeconds: 0,
      utilizationDenominatorSeconds: 0,
    };
  }

  if (!visibility.resources) {
    return {
      ...aggregates,
      utilizationNumeratorSeconds: 0,
      utilizationDenominatorSeconds: 0,
    };
  }

  if (!visibility.measurements) {
    return {
      ...aggregates,
      reworkNumerator: 0,
      reworkDenominator: 0,
      measurementApproved: 0,
      measurementDecided: 0,
    };
  }

  return aggregates;
}
