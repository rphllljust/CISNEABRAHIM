import { Injectable } from '@nestjs/common';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import {
  buildCashForecast,
  countFalseRealizedValues,
} from '../domain/cash-flow-forecast';
import {
  validateProjectCashForecastInput,
  type ProjectCashForecastInput,
} from '../domain/cash-flow-forecast.validation';
import { CashFlowForecastRepository } from '../repositories/cash-flow-forecast.repository';
import {
  toCashForecastResponse,
  type CashForecastResponse,
} from '../serializers/cash-flow-forecast-response.serializer';
import { CashFlowForecastAccessAuthz } from './cash-flow-forecast-access.authz';
import { mapCashForecastDomainError } from './cash-flow-forecast-access.errors';

@Injectable()
export class CashFlowForecastAccessService {
  constructor(
    private readonly repository: CashFlowForecastRepository,
    private readonly authz: CashFlowForecastAccessAuthz,
  ) {}

  async project(actor: IdentityAuthzContext, input: ProjectCashForecastInput): Promise<CashForecastResponse> {
    try {
      const validated = validateProjectCashForecastInput(input);
      await this.authz.assertForecastAction(actor, AUTHZ_ACTIONS.FinanceCashForecastRead, {
        id: actor.identityId,
        unitId: validated.unitId,
      });
      const [receivables, receivableInstallments, payables, payableInstallments, movements] =
        await Promise.all([
          this.repository.listReceivables(validated.unitId, validated.currencyCode),
          this.repository.listReceivableInstallments(validated.unitId, validated.currencyCode),
          this.repository.listPayables(validated.unitId, validated.currencyCode),
          this.repository.listPayableInstallments(validated.unitId, validated.currencyCode),
          this.repository.listPostedTreasuryMovements(
            validated.unitId,
            validated.currencyCode,
            validated.asOf,
          ),
        ]);
      const [settlements, payments] = await Promise.all([
        this.repository.listSettlements(receivables.map((item) => item.id)),
        this.repository.listPayments(payables.map((item) => item.id)),
      ]);
      const built = buildCashForecast({
        asOf: validated.asOf,
        horizonEndsOn: validated.horizonEndsOn,
        movements,
        receivables,
        receivableInstallments: receivableInstallments.map((item) => ({
          id: item.id,
          documentId: item.document_id,
          principal: item.principal,
          dueOn: item.due_on,
        })),
        settlements: settlements.map((item) => ({
          id: item.id,
          receivableId: item.receivable_id,
          installmentId: item.installment_id,
          amount: item.amount,
          status: item.status,
        })),
        payables,
        payableInstallments: payableInstallments.map((item) => ({
          id: item.id,
          documentId: item.document_id,
          principal: item.principal,
          dueOn: item.due_on,
        })),
        payments: payments.map((item) => ({
          id: item.id,
          payableId: item.payable_id,
          installmentId: item.installment_id,
          kind: item.kind,
          amount: item.amount,
        })),
      });
      const falseRealizedValues = countFalseRealizedValues(built.lines);
      return toCashForecastResponse({
        unitId: validated.unitId,
        currencyCode: validated.currencyCode,
        asOf: validated.asOf,
        horizonEndsOn: validated.horizonEndsOn,
        status: built.status,
        realizedCash: built.realizedCash,
        realizedInflows: built.realizedInflows,
        realizedOutflows: built.realizedOutflows,
        forecastInflows: built.forecastInflows,
        forecastOutflows: built.forecastOutflows,
        overdueInflows: built.overdueInflows,
        overdueOutflows: built.overdueOutflows,
        projectedCash: built.projectedCash,
        falseRealizedValues,
        lines: built.lines,
        reconciliation: built.reconciliation,
      });
    } catch (error) {
      throw mapCashForecastDomainError(error);
    }
  }
}
