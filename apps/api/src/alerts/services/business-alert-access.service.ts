import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { ScopeSqlPredicate } from '../../authorization/services/scope-enforcement.service';
import type {
  BusinessAlertSeverity,
  BusinessAlertStatus,
  BusinessAlertType,
} from '../domain/business-alert';
import { ALERT_ERROR_CODES } from '../errors/alert-error-codes';
import { AlertHttpException } from '../errors/alert-http.exception';
import { BusinessAlertsRepository } from '../repositories/business-alerts.repository';

export type AlertListQuery = {
  status?: string;
  type?: string;
  severity?: string;
  limit?: string;
};

@Injectable()
export class BusinessAlertAccessService {
  constructor(
    private readonly repository: BusinessAlertsRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async listAlerts(actor: IdentityAuthzContext, query: AlertListQuery) {
    const scope = await this.resolveUnitScope(actor);
    if (!scope) {
      throw new AlertHttpException(403, ALERT_ERROR_CODES.ACCESS_DENIED, 'Access denied.');
    }

    return this.repository.listAlerts({
      scope,
      status: parseStatus(query.status),
      alertType: parseType(query.type),
      severity: parseSeverity(query.severity),
      limit: parseLimit(query.limit),
    });
  }

  async getSummary(actor: IdentityAuthzContext) {
    const scope = await this.resolveUnitScope(actor);
    if (!scope) {
      throw new AlertHttpException(403, ALERT_ERROR_CODES.ACCESS_DENIED, 'Access denied.');
    }
    const activeCount = await this.repository.countActive(scope);
    return { activeCount };
  }

  private async resolveUnitScope(actor: IdentityAuthzContext): Promise<ScopeSqlPredicate | null> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    if (grants.length === 0) {
      const billingGrants = await this.authorizationRepository.findActiveGrants(
        actor.identityId,
        AUTHZ_ACTIONS.BillingBillingRecordRead,
        AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      );
      if (billingGrants.length === 0) {
        return null;
      }
      return this.scopeEnforcement.buildServiceOrderListFilter(billingGrants);
    }
    return this.scopeEnforcement.buildServiceOrderListFilter(grants);
  }
}

function parseStatus(value: string | undefined): BusinessAlertStatus | undefined {
  if (value === 'ACTIVE' || value === 'RESOLVED') {
    return value;
  }
  return undefined;
}

function parseType(value: string | undefined): BusinessAlertType | undefined {
  const allowed: BusinessAlertType[] = [
    'SERVICE_ORDER_DUE_SOON',
    'SERVICE_ORDER_OVERDUE',
    'SERVICE_ORDER_STALLED',
    'MEASUREMENT_AGING',
    'BILLING_AGING',
    'PAYMENT_OVERDUE',
  ];
  return allowed.find((entry) => entry === value);
}

function parseSeverity(value: string | undefined): BusinessAlertSeverity | undefined {
  if (value === 'WARNING' || value === 'CRITICAL') {
    return value;
  }
  return undefined;
}

function parseLimit(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 50;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 50;
  }
  return Math.min(parsed, 200);
}
