import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type {
  CashForecastInstallmentRow,
  CashForecastMovementRow,
  CashForecastPayableRow,
  CashForecastPaymentRow,
  CashForecastReceivableRow,
  CashForecastSettlementRow,
} from './cash-flow-forecast.repository.types';

@Injectable()
export class CashFlowForecastRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async listReceivables(unitId: string, currencyCode: string): Promise<CashForecastReceivableRow[]> {
    const result = await this.pool().query<CashForecastReceivableRow>(
      `SELECT id, lifecycle::text AS lifecycle, principal::text AS principal
       FROM fin.receivables
       WHERE unit_id = $1 AND currency_code = $2`,
      [unitId, currencyCode],
    );
    return result.rows;
  }

  async listReceivableInstallments(
    unitId: string,
    currencyCode: string,
  ): Promise<CashForecastInstallmentRow[]> {
    const result = await this.pool().query<CashForecastInstallmentRow>(
      `SELECT i.id, i.receivable_id AS document_id, i.principal::text AS principal, i.due_date::text AS due_on
       FROM fin.receivable_installments i
       INNER JOIN fin.receivables r ON r.id = i.receivable_id
       WHERE r.unit_id = $1 AND r.currency_code = $2
       ORDER BY i.due_date, i.installment_number`,
      [unitId, currencyCode],
    );
    return result.rows;
  }

  async listSettlements(receivableIds: string[]): Promise<CashForecastSettlementRow[]> {
    if (receivableIds.length === 0) {
      return [];
    }
    const result = await this.pool().query<CashForecastSettlementRow>(
      `SELECT id, receivable_id, installment_id, amount::text AS amount, status::text AS status
       FROM fin.settlements
       WHERE receivable_id = ANY($1::uuid[]) AND status = 'POSTED'`,
      [receivableIds],
    );
    return result.rows;
  }

  async listPayables(unitId: string, currencyCode: string): Promise<CashForecastPayableRow[]> {
    const result = await this.pool().query<CashForecastPayableRow>(
      `SELECT id, lifecycle::text AS lifecycle, principal::text AS principal
       FROM fin.payables
       WHERE unit_id = $1 AND currency_code = $2`,
      [unitId, currencyCode],
    );
    return result.rows;
  }

  async listPayableInstallments(
    unitId: string,
    currencyCode: string,
  ): Promise<CashForecastInstallmentRow[]> {
    const result = await this.pool().query<CashForecastInstallmentRow>(
      `SELECT i.id, i.payable_id AS document_id, i.principal::text AS principal, i.due_date::text AS due_on
       FROM fin.payable_installments i
       INNER JOIN fin.payables p ON p.id = i.payable_id
       WHERE p.unit_id = $1 AND p.currency_code = $2
       ORDER BY i.due_date, i.installment_number`,
      [unitId, currencyCode],
    );
    return result.rows;
  }

  async listPayments(payableIds: string[]): Promise<CashForecastPaymentRow[]> {
    if (payableIds.length === 0) {
      return [];
    }
    const result = await this.pool().query<CashForecastPaymentRow>(
      `SELECT id, payable_id, installment_id, kind::text AS kind, amount::text AS amount
       FROM fin.payments
       WHERE payable_id = ANY($1::uuid[])`,
      [payableIds],
    );
    return result.rows;
  }

  async listPostedTreasuryMovements(
    unitId: string,
    currencyCode: string,
    asOf: string,
  ): Promise<CashForecastMovementRow[]> {
    const result = await this.pool().query<CashForecastMovementRow>(
      `SELECT t.direction::text AS direction, t.amount::text AS amount, t.status::text AS status
       FROM fin.financial_transactions t
       INNER JOIN fin.financial_accounts a ON a.id = t.account_id
       WHERE a.unit_id = $1
         AND a.currency_code = $2
         AND t.status = 'POSTED'
         AND t.occurred_at::date <= $3::date`,
      [unitId, currencyCode, asOf],
    );
    return result.rows;
  }
}
