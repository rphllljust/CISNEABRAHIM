import { Injectable, Logger } from '@nestjs/common';
import { resolveBusinessTimezone } from '../../analytics/domain/business-timezone';
import { buildAlertDeduplicationKey } from '../domain/alert-deduplication';
import { loadAlertPolicyConfig } from '../domain/alert-policy.config';
import { getControlledNow } from '../domain/controlled-clock';
import {
  evaluateBillingAging,
  evaluateMeasurementAging,
  evaluatePaymentOverdue,
  evaluateServiceOrderDueSoon,
  evaluateServiceOrderOverdueAlert,
  evaluateServiceOrderStalled,
  shouldEscalateOverdueServiceOrder,
  type AlertEvaluationResult,
} from '../domain/alert-evaluation.engine';
import {
  BUSINESS_ALERT_AGGREGATE_TYPES,
  BUSINESS_ALERT_TYPES,
  type BusinessAlertAggregateType,
  type BusinessAlertType,
} from '../domain/business-alert';
import { AlertCandidateRepository } from '../repositories/alert-candidate.repository';
import { BusinessAlertsRepository } from '../repositories/business-alerts.repository';

export type AlertScanResult = {
  created: number;
  touched: number;
  resolved: number;
};

@Injectable()
export class BusinessAlertScanService {
  private readonly logger = new Logger(BusinessAlertScanService.name);

  constructor(
    private readonly candidates: AlertCandidateRepository,
    private readonly alerts: BusinessAlertsRepository,
  ) {}

  async runScan(now: Date = getControlledNow()): Promise<AlertScanResult> {
    const policy = loadAlertPolicyConfig();
    const businessTimezone = resolveBusinessTimezone();
    const result: AlertScanResult = { created: 0, touched: 0, resolved: 0 };

    for (const candidate of await this.candidates.loadServiceOrderCandidates()) {
      const context = {
        aggregateType: BUSINESS_ALERT_AGGREGATE_TYPES.ServiceOrder,
        aggregateId: candidate.id,
        unitId: candidate.unitId,
        clientId: candidate.clientId,
        now,
        result,
      };

      await this.syncAlert({
        ...context,
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderDueSoon,
        evaluation: evaluateServiceOrderDueSoon(candidate, now, policy),
      });

      const overdueEvaluation = evaluateServiceOrderOverdueAlert(candidate, now, policy);
      await this.syncAlert({
        ...context,
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
        evaluation: overdueEvaluation,
      });

      if (overdueEvaluation) {
        const delayDays = overdueEvaluation.metadata['delayDays'] as number | undefined;
        if (shouldEscalateOverdueServiceOrder(delayDays ?? null, policy)) {
          await this.syncAlert({
            ...context,
            alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
            evaluation: evaluateServiceOrderOverdueAlert(candidate, now, policy, { escalation: true }),
          });
        }
      }

      await this.syncAlert({
        ...context,
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderStalled,
        evaluation: evaluateServiceOrderStalled(candidate, now, policy),
      });
    }

    for (const candidate of await this.candidates.loadMeasurementCandidates()) {
      await this.syncAlert({
        aggregateType: BUSINESS_ALERT_AGGREGATE_TYPES.Measurement,
        aggregateId: candidate.id,
        unitId: candidate.unitId,
        clientId: candidate.clientId,
        alertType: BUSINESS_ALERT_TYPES.MeasurementAging,
        evaluation: evaluateMeasurementAging(candidate, now, policy),
        now,
        result,
      });
    }

    for (const candidate of await this.candidates.loadBillingRecordCandidates()) {
      await this.syncAlert({
        aggregateType: BUSINESS_ALERT_AGGREGATE_TYPES.BillingRecord,
        aggregateId: candidate.id,
        unitId: candidate.unitId,
        clientId: candidate.clientId,
        alertType: BUSINESS_ALERT_TYPES.BillingAging,
        evaluation: evaluateBillingAging(candidate, now, policy),
        now,
        result,
      });
    }

    for (const candidate of await this.candidates.loadBillingDocumentCandidates(businessTimezone)) {
      await this.syncAlert({
        aggregateType: BUSINESS_ALERT_AGGREGATE_TYPES.BillingDocument,
        aggregateId: candidate.id,
        unitId: candidate.unitId,
        clientId: candidate.clientId,
        alertType: BUSINESS_ALERT_TYPES.PaymentOverdue,
        evaluation: evaluatePaymentOverdue(candidate, now, businessTimezone),
        now,
        result,
      });
    }

    result.resolved += await this.alerts.resolveTerminalServiceOrderAlerts(now);

    this.logger.log(
      `Alert scan complete created=${result.created} touched=${result.touched} resolved=${result.resolved}`,
    );
    return result;
  }

  private async syncAlert(input: {
    evaluation: AlertEvaluationResult | null;
    aggregateType: BusinessAlertAggregateType;
    aggregateId: string;
    unitId: string;
    clientId: string | null;
    alertType: BusinessAlertType;
    now: Date;
    result: AlertScanResult;
  }): Promise<void> {
    if (!input.evaluation) {
      const active = await this.alerts.listActiveByAggregate(
        input.aggregateType,
        input.aggregateId,
        input.alertType,
      );
      for (const alert of active) {
        await this.alerts.resolveAlert(alert.id, input.now);
        input.result.resolved += 1;
      }
      return;
    }

    const deduplicationKey = buildAlertDeduplicationKey({
      alertType: input.evaluation.alertType as BusinessAlertType,
      aggregateId: input.aggregateId,
      policyWindow: input.evaluation.policyWindow,
    });
    const activeAlert = await this.alerts.findActiveByDeduplicationKey(deduplicationKey);
    if (activeAlert) {
      await this.alerts.touchAlert(activeAlert.id, input.now);
      input.result.touched += 1;
      return;
    }

    const created = await this.alerts.createAlert({
      evaluation: input.evaluation,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      unitId: input.unitId,
      clientId: input.clientId,
      now: input.now,
    });
    if (created) {
      input.result.created += 1;
    }
  }
}
