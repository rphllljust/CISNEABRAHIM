import { Injectable } from '@nestjs/common';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid } from '../../platform/kernel/uuid';
import { AccountingError } from '../domain/ledger';
import {
  totalsByAccount,
  trialBalanceFromTotals,
  type PostedLineFact,
} from '../domain/reporting';
import { AccountingRepository } from '../repositories/accounting.repository';
import type { AccountingAccountRow, AccountingPeriodRow } from '../repositories/accounting.repository.types';
import {
  toBalanceSheetResponse,
  toGeneralLedgerResponse,
  toIncomeStatementResponse,
  toJournalBookResponse,
  toTrialBalanceResponse,
  type BalanceSheetResponse,
  type GeneralLedgerResponse,
  type IncomeStatementResponse,
  type JournalBookResponse,
  type TrialBalanceResponse,
} from '../serializers/accounting-reporting.serializer';
import { AccountingAccessAuthz } from './accounting-access.authz';
import { mapAccountingDomainError } from './accounting-access.errors';

@Injectable()
export class AccountingReportingService {
  constructor(
    private readonly repository: AccountingRepository,
    private readonly authz: AccountingAccessAuthz,
  ) {}

  async journalBook(actor: IdentityAuthzContext, periodId: string): Promise<JournalBookResponse> {
    try {
      const period = await this.requirePeriod(periodId, actor);
      const aggregates = await this.repository.listPostedJournalsInPeriod(period.id);
      return toJournalBookResponse(period.id, aggregates);
    } catch (error) {
      throw mapAccountingDomainError(error);
    }
  }

  async generalLedger(actor: IdentityAuthzContext, periodId: string): Promise<GeneralLedgerResponse> {
    try {
      const { period, rows } = await this.loadTotals(periodId, actor);
      const movementsByAccount: Record<string, Awaited<ReturnType<AccountingRepository['listLedgerMovements']>>> =
        {};
      for (const row of rows) {
        if (row.periodDebits === '0.0000' && row.periodCredits === '0.0000') {
          continue;
        }
        movementsByAccount[row.accountId] = await this.repository.listLedgerMovements(
          period.id,
          row.accountId,
        );
      }
      return toGeneralLedgerResponse(period.id, rows, movementsByAccount);
    } catch (error) {
      throw mapAccountingDomainError(error);
    }
  }

  async trialBalance(actor: IdentityAuthzContext, periodId: string): Promise<TrialBalanceResponse> {
    try {
      const { period, rows } = await this.loadTotals(periodId, actor);
      return toTrialBalanceResponse(period.id, rows);
    } catch (error) {
      throw mapAccountingDomainError(error);
    }
  }

  async incomeStatement(
    actor: IdentityAuthzContext,
    periodId: string,
  ): Promise<IncomeStatementResponse> {
    try {
      const { period, accounts, rows } = await this.loadTotals(periodId, actor);
      return toIncomeStatementResponse(period.id, accounts, rows);
    } catch (error) {
      throw mapAccountingDomainError(error);
    }
  }

  async balanceSheet(actor: IdentityAuthzContext, periodId: string): Promise<BalanceSheetResponse> {
    try {
      const { period, accounts, rows } = await this.loadTotals(periodId, actor);
      return toBalanceSheetResponse(period.id, accounts, rows);
    } catch (error) {
      throw mapAccountingDomainError(error);
    }
  }

  async loadTotals(
    periodId: string,
    actor: IdentityAuthzContext,
  ): Promise<{
    period: AccountingPeriodRow;
    accounts: AccountingAccountRow[];
    rows: ReturnType<typeof totalsByAccount>;
  }> {
    const period = await this.requirePeriod(periodId, actor);
    const accounts = await this.repository.listAccountsByChart(period.chart_id);
    const opening = await this.repository.listPostedLineFacts({
      chartId: period.chart_id,
      beforeOn: period.starts_on.slice(0, 10),
    });
    const periodLines = await this.repository.listPostedLineFacts({
      chartId: period.chart_id,
      periodId: period.id,
    });
    const rows = totalsByAccount(
      accounts.map((account) => ({
        id: account.id,
        code: account.code,
        name: account.name,
        class: account.class,
      })),
      opening.map(toFact),
      periodLines.map(toFact),
    );
    return { period, accounts, rows };
  }

  async trialBalanceSnapshot(periodId: string, actor: IdentityAuthzContext) {
    const { rows } = await this.loadTotals(periodId, actor);
    return trialBalanceFromTotals(rows);
  }

  private async requirePeriod(
    periodId: string,
    actor: IdentityAuthzContext,
  ): Promise<AccountingPeriodRow> {
    assertUuid(periodId, 'periodId');
    const period = await this.repository.findPeriodById(periodId);
    if (!period) {
      throw new AccountingError('ACCOUNTING_PERIOD_NOT_FOUND');
    }
    await this.authz.assertAccountingAction(actor, AUTHZ_ACTIONS.AccountingJournalList, {
      id: period.id,
      unitId: period.unit_id,
    });
    return period;
  }
}

function toFact(row: {
  account_id: string;
  account_code: string;
  account_name: string;
  account_class: string;
  direction: string;
  amount: string;
}): PostedLineFact {
  return {
    accountId: row.account_id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountClass: row.account_class,
    direction: row.direction,
    amount: row.amount,
  };
}
