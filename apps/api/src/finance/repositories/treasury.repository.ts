import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { classifyRowVersion } from '../../infrastructure/database/optimistic-lock';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { compareMoneyAmounts } from '../../platform/kernel/money-math';
import {
  FINANCIAL_ACCOUNT_KINDS,
  FINANCIAL_DIRECTIONS,
  FINANCIAL_TRANSACTION_STATUSES,
  TREASURY_ORIGIN_KINDS,
  TREASURY_TRANSFER_KINDS,
  TreasuryError,
  assertAccountActive,
  assertReversalAmount,
  assertSameCurrency,
  assertSufficientBalance,
  assertTransferLegs,
  derivedBalance,
  oppositeDirection,
  type PostedTreasuryMovement,
} from '../domain/treasury';
import type {
  BankAccountRow,
  CashAccountRow,
  FinancialAccountRow,
  FinancialTransactionRow,
  OpenFinancialAccountPersistenceInput,
  PostTreasuryMovementPersistenceInput,
  ReverseMovementPersistenceInput,
  ReverseTransferPersistenceInput,
  TransferTreasuryPersistenceInput,
  TreasuryTransferRow,
} from './treasury.repository.types';

const ACCOUNT_RETURNING = `
  id, unit_id, kind::text AS kind, code, name, currency_code, overdraft_allowed,
  lifecycle::text AS lifecycle, closed_at, closed_by_identity_id, close_reason, row_version,
  created_at, updated_at, created_by_identity_id, updated_by_identity_id
`;

const TRANSFER_RETURNING = `
  id, from_account_id, to_account_id, kind::text AS kind, amount::text AS amount, currency_code,
  occurred_at, idempotency_key, reference, origin_kind::text AS origin_kind, origin_id, origin_reference,
  reverses_transfer_id, actor_identity_id, created_at
`;

const TX_RETURNING = `
  id, account_id, direction::text AS direction, amount::text AS amount, currency_code, occurred_at,
  status::text AS status, idempotency_key, reference, origin_kind::text AS origin_kind, origin_id,
  origin_reference, transfer_id, reverses_transaction_id, actor_identity_id, created_at
`;

function toPosted(rows: FinancialTransactionRow[]): PostedTreasuryMovement[] {
  return rows.map((item) => ({
    direction: item.direction,
    amount: item.amount,
    status: item.status,
  }));
}

@Injectable()
export class TreasuryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findAccountById(accountId: string): Promise<FinancialAccountRow | null> {
    const result = await this.pool().query<FinancialAccountRow>(
      `SELECT ${ACCOUNT_RETURNING} FROM fin.financial_accounts WHERE id = $1`,
      [accountId],
    );
    return result.rows[0] ?? null;
  }

  async findBankAccount(accountId: string): Promise<BankAccountRow | null> {
    const result = await this.pool().query<BankAccountRow>(
      `SELECT financial_account_id, bank_code, agency, account_number
       FROM fin.bank_accounts WHERE financial_account_id = $1`,
      [accountId],
    );
    return result.rows[0] ?? null;
  }

  async findCashAccount(accountId: string): Promise<CashAccountRow | null> {
    const result = await this.pool().query<CashAccountRow>(
      `SELECT financial_account_id, location_code FROM fin.cash_accounts WHERE financial_account_id = $1`,
      [accountId],
    );
    return result.rows[0] ?? null;
  }

  async listAccounts(): Promise<FinancialAccountRow[]> {
    const result = await this.pool().query<FinancialAccountRow>(
      `SELECT ${ACCOUNT_RETURNING} FROM fin.financial_accounts ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  async listMovements(accountId: string): Promise<FinancialTransactionRow[]> {
    const result = await this.pool().query<FinancialTransactionRow>(
      `SELECT ${TX_RETURNING}
       FROM fin.financial_transactions
       WHERE account_id = $1
       ORDER BY occurred_at, created_at`,
      [accountId],
    );
    return result.rows;
  }

  async findTransferById(transferId: string): Promise<TreasuryTransferRow | null> {
    const result = await this.pool().query<TreasuryTransferRow>(
      `SELECT ${TRANSFER_RETURNING} FROM fin.treasury_transfers WHERE id = $1`,
      [transferId],
    );
    return result.rows[0] ?? null;
  }

  async listTransferLegs(transferId: string): Promise<FinancialTransactionRow[]> {
    const result = await this.pool().query<FinancialTransactionRow>(
      `SELECT ${TX_RETURNING}
       FROM fin.financial_transactions
       WHERE transfer_id = $1
       ORDER BY direction DESC`,
      [transferId],
    );
    return result.rows;
  }

  async findTransactionById(transactionId: string): Promise<FinancialTransactionRow | null> {
    const result = await this.pool().query<FinancialTransactionRow>(
      `SELECT ${TX_RETURNING} FROM fin.financial_transactions WHERE id = $1`,
      [transactionId],
    );
    return result.rows[0] ?? null;
  }

  async openAccount(input: OpenFinancialAccountPersistenceInput): Promise<{
    account: FinancialAccountRow;
    bank: BankAccountRow | null;
    cash: CashAccountRow | null;
  }> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query<FinancialAccountRow>(
        `SELECT ${ACCOUNT_RETURNING} FROM fin.financial_accounts WHERE unit_id = $1 AND code = $2`,
        [input.unitId, input.code],
      );
      if (existing.rows[0]) {
        const account = existing.rows[0];
        const bank = await this.findBankWithClient(client, account.id);
        const cash = await this.findCashWithClient(client, account.id);
        await client.query('COMMIT');
        return { account, bank, cash };
      }

      const accountId = randomUUID();
      const inserted = await client.query<FinancialAccountRow>(
        `INSERT INTO fin.financial_accounts (
           id, unit_id, kind, code, name, currency_code, overdraft_allowed,
           created_by_identity_id, updated_by_identity_id
         )
         VALUES ($1, $2, $3::fin.financial_account_kind, $4, $5, $6, $7, $8, $8)
         RETURNING ${ACCOUNT_RETURNING}`,
        [
          accountId,
          input.unitId,
          input.kind,
          input.code,
          input.name,
          input.currencyCode,
          input.overdraftAllowed,
          input.actorIdentityId,
        ],
      );
      const account = inserted.rows[0]!;
      let bank: BankAccountRow | null = null;
      let cash: CashAccountRow | null = null;
      if (input.kind === FINANCIAL_ACCOUNT_KINDS.Bank && input.bank) {
        const row = await client.query<BankAccountRow>(
          `INSERT INTO fin.bank_accounts (financial_account_id, bank_code, agency, account_number)
           VALUES ($1, $2, $3, $4)
           RETURNING financial_account_id, bank_code, agency, account_number`,
          [account.id, input.bank.bankCode, input.bank.agency, input.bank.accountNumber],
        );
        bank = row.rows[0]!;
      }
      if (input.kind === FINANCIAL_ACCOUNT_KINDS.Cash && input.cash) {
        const row = await client.query<CashAccountRow>(
          `INSERT INTO fin.cash_accounts (financial_account_id, location_code)
           VALUES ($1, $2)
           RETURNING financial_account_id, location_code`,
          [account.id, input.cash.locationCode],
        );
        cash = row.rows[0]!;
      }
      if (input.opening) {
        await this.insertMovement(client, {
          accountId: account.id,
          direction: FINANCIAL_DIRECTIONS.Credit,
          amount: input.opening.amount,
          currencyCode: account.currency_code,
          occurredAt: new Date().toISOString(),
          idempotencyKey: input.opening.idempotencyKey,
          reference: input.opening.reference,
          originKind: TREASURY_ORIGIN_KINDS.OpeningBalance,
          originId: input.opening.originId,
          originReference: input.opening.reference,
          actorIdentityId: input.actorIdentityId,
          transferId: null,
          reversesTransactionId: null,
        });
      }
      await client.query('COMMIT');
      return { account, bank, cash };
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        const raced = await this.pool().query<FinancialAccountRow>(
          `SELECT ${ACCOUNT_RETURNING} FROM fin.financial_accounts WHERE unit_id = $1 AND code = $2`,
          [input.unitId, input.code],
        );
        if (raced.rows[0]) {
          return {
            account: raced.rows[0],
            bank: await this.findBankAccount(raced.rows[0].id),
            cash: await this.findCashAccount(raced.rows[0].id),
          };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async postMovement(input: PostTreasuryMovementPersistenceInput): Promise<{
    account: FinancialAccountRow;
    movement: FinancialTransactionRow;
    idempotent: boolean;
  }> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockAccount(client, input.accountId);
      const cached = await client.query<FinancialTransactionRow>(
        `SELECT ${TX_RETURNING}
         FROM fin.financial_transactions
         WHERE account_id = $1 AND idempotency_key = $2`,
        [input.accountId, input.idempotencyKey],
      );
      if (cached.rows[0]) {
        await client.query('COMMIT');
        return { account: locked, movement: cached.rows[0], idempotent: true };
      }
      assertAccountActive(locked.lifecycle);
      if (classifyRowVersion(locked, input.rowVersion) === 'mismatch') {
        throw new TreasuryError('TREASURY_VERSION_CONFLICT');
      }
      assertSameCurrency(locked.currency_code, locked.currency_code);
      if (input.direction === FINANCIAL_DIRECTIONS.Debit) {
        const posted = await this.lockMovements(client, locked.id);
        assertSufficientBalance({
          currentBalance: derivedBalance(toPosted(posted)),
          debitAmount: input.amount,
          overdraftAllowed: locked.overdraft_allowed,
        });
      }
      const movement = await this.insertMovement(client, {
        accountId: locked.id,
        direction: input.direction,
        amount: input.amount,
        currencyCode: locked.currency_code,
        occurredAt: input.occurredAt,
        idempotencyKey: input.idempotencyKey,
        reference: input.reference,
        originKind: input.originKind,
        originId: input.originId,
        originReference: input.originReference,
        actorIdentityId: input.actorIdentityId,
        transferId: null,
        reversesTransactionId: null,
      });
      const account = await this.bumpAccount(client, locked.id, input.actorIdentityId);
      await client.query('COMMIT');
      return { account, movement, idempotent: false };
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        const cached = await this.pool().query<FinancialTransactionRow>(
          `SELECT ${TX_RETURNING}
           FROM fin.financial_transactions
           WHERE account_id = $1 AND idempotency_key = $2`,
          [input.accountId, input.idempotencyKey],
        );
        const account = await this.findAccountById(input.accountId);
        if (cached.rows[0] && account) {
          return { account, movement: cached.rows[0], idempotent: true };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async transfer(input: TransferTreasuryPersistenceInput): Promise<{
    transfer: TreasuryTransferRow;
    legs: FinancialTransactionRow[];
    fromAccount: FinancialAccountRow;
    toAccount: FinancialAccountRow;
    idempotent: boolean;
  }> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const [firstId, secondId] =
        compareIds(input.fromAccountId, input.toAccountId) < 0
          ? [input.fromAccountId, input.toAccountId]
          : [input.toAccountId, input.fromAccountId];
      await this.lockAccount(client, firstId);
      await this.lockAccount(client, secondId);
      const fromAccount = await this.lockAccount(client, input.fromAccountId);
      const toAccount = await this.lockAccount(client, input.toAccountId);

      const cached = await client.query<TreasuryTransferRow>(
        `SELECT ${TRANSFER_RETURNING}
         FROM fin.treasury_transfers
         WHERE from_account_id = $1 AND idempotency_key = $2`,
        [input.fromAccountId, input.idempotencyKey],
      );
      if (cached.rows[0]) {
        const legs = await this.listLegsWithClient(client, cached.rows[0].id);
        await client.query('COMMIT');
        return {
          transfer: cached.rows[0],
          legs,
          fromAccount,
          toAccount,
          idempotent: true,
        };
      }

      assertAccountActive(fromAccount.lifecycle);
      assertAccountActive(toAccount.lifecycle);
      if (classifyRowVersion(fromAccount, input.rowVersionFrom) === 'mismatch') {
        throw new TreasuryError('TREASURY_VERSION_CONFLICT');
      }
      if (classifyRowVersion(toAccount, input.rowVersionTo) === 'mismatch') {
        throw new TreasuryError('TREASURY_VERSION_CONFLICT');
      }
      assertSameCurrency(fromAccount.currency_code, toAccount.currency_code);
      const debit = {
        accountId: fromAccount.id,
        direction: FINANCIAL_DIRECTIONS.Debit,
        amount: input.amount,
      };
      const credit = {
        accountId: toAccount.id,
        direction: FINANCIAL_DIRECTIONS.Credit,
        amount: input.amount,
      };
      assertTransferLegs({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        debit,
        credit,
      });

      const sourcePosted = await this.lockMovements(client, fromAccount.id);
      assertSufficientBalance({
        currentBalance: derivedBalance(toPosted(sourcePosted)),
        debitAmount: input.amount,
        overdraftAllowed: fromAccount.overdraft_allowed,
      });

      const originId = input.originId;
      const transferId = randomUUID();
      const transfer = await client.query<TreasuryTransferRow>(
        `INSERT INTO fin.treasury_transfers (
           id, from_account_id, to_account_id, kind, amount, currency_code, occurred_at,
           idempotency_key, reference, origin_kind, origin_id, origin_reference, actor_identity_id
         )
         VALUES (
           $1, $2, $3, $4::fin.treasury_transfer_kind, $5, $6, $7::timestamptz, $8, $9,
           $10::fin.treasury_origin_kind, $11, $12, $13
         )
         RETURNING ${TRANSFER_RETURNING}`,
        [
          transferId,
          fromAccount.id,
          toAccount.id,
          TREASURY_TRANSFER_KINDS.Transfer,
          input.amount,
          fromAccount.currency_code,
          input.occurredAt,
          input.idempotencyKey,
          input.reference,
          TREASURY_ORIGIN_KINDS.Transfer,
          originId,
          input.originReference,
          input.actorIdentityId,
        ],
      );

      const debitLeg = await this.insertMovement(client, {
        accountId: fromAccount.id,
        direction: FINANCIAL_DIRECTIONS.Debit,
        amount: input.amount,
        currencyCode: fromAccount.currency_code,
        occurredAt: input.occurredAt,
        idempotencyKey: `${input.idempotencyKey}:debit`,
        reference: input.reference,
        originKind: TREASURY_ORIGIN_KINDS.Transfer,
        originId,
        originReference: input.originReference,
        actorIdentityId: input.actorIdentityId,
        transferId,
        reversesTransactionId: null,
      });
      const creditLeg = await this.insertMovement(client, {
        accountId: toAccount.id,
        direction: FINANCIAL_DIRECTIONS.Credit,
        amount: input.amount,
        currencyCode: toAccount.currency_code,
        occurredAt: input.occurredAt,
        idempotencyKey: `${input.idempotencyKey}:credit`,
        reference: input.reference,
        originKind: TREASURY_ORIGIN_KINDS.Transfer,
        originId,
        originReference: input.originReference,
        actorIdentityId: input.actorIdentityId,
        transferId,
        reversesTransactionId: null,
      });
      if (!debitLeg || !creditLeg) {
        throw new TreasuryError('TREASURY_UNBALANCED_TRANSFER');
      }

      const updatedFrom = await this.bumpAccount(client, fromAccount.id, input.actorIdentityId);
      const updatedTo = await this.bumpAccount(client, toAccount.id, input.actorIdentityId);
      await client.query('COMMIT');
      return {
        transfer: transfer.rows[0]!,
        legs: [debitLeg, creditLeg],
        fromAccount: updatedFrom,
        toAccount: updatedTo,
        idempotent: false,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        const cached = await this.pool().query<TreasuryTransferRow>(
          `SELECT ${TRANSFER_RETURNING}
           FROM fin.treasury_transfers
           WHERE from_account_id = $1 AND idempotency_key = $2`,
          [input.fromAccountId, input.idempotencyKey],
        );
        const fromAccount = await this.findAccountById(input.fromAccountId);
        const toAccount = await this.findAccountById(input.toAccountId);
        if (cached.rows[0] && fromAccount && toAccount) {
          const legs = await this.listTransferLegs(cached.rows[0].id);
          return {
            transfer: cached.rows[0],
            legs,
            fromAccount,
            toAccount,
            idempotent: true,
          };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async reverseMovement(input: ReverseMovementPersistenceInput): Promise<{
    account: FinancialAccountRow;
    movement: FinancialTransactionRow;
    idempotent: boolean;
  }> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const source = await client.query<FinancialTransactionRow>(
        `SELECT ${TX_RETURNING} FROM fin.financial_transactions WHERE id = $1 FOR UPDATE`,
        [input.transactionId],
      );
      const original = source.rows[0];
      if (!original) {
        throw new TreasuryError('TREASURY_TRANSACTION_NOT_FOUND');
      }
      if (original.transfer_id) {
        throw new TreasuryError('TREASURY_REVERSE_VIA_TRANSFER');
      }
      const account = await this.lockAccount(client, original.account_id);
      const cached = await client.query<FinancialTransactionRow>(
        `SELECT ${TX_RETURNING}
         FROM fin.financial_transactions
         WHERE account_id = $1 AND idempotency_key = $2`,
        [account.id, input.idempotencyKey],
      );
      if (cached.rows[0]) {
        await client.query('COMMIT');
        return { account, movement: cached.rows[0], idempotent: true };
      }
      assertAccountActive(account.lifecycle);
      if (classifyRowVersion(account, input.rowVersion) === 'mismatch') {
        throw new TreasuryError('TREASURY_VERSION_CONFLICT');
      }
      const reversals = await client.query<FinancialTransactionRow>(
        `SELECT ${TX_RETURNING} FROM fin.financial_transactions WHERE reverses_transaction_id = $1 FOR UPDATE`,
        [original.id],
      );
      const amount = assertReversalAmount(
        original.amount,
        reversals.rows.map((row) => row.amount),
        input.amount ?? original.amount,
      );
      const direction = oppositeDirection(original.direction);
      if (direction === FINANCIAL_DIRECTIONS.Debit) {
        const posted = await this.lockMovements(client, account.id);
        assertSufficientBalance({
          currentBalance: derivedBalance(toPosted(posted)),
          debitAmount: amount,
          overdraftAllowed: account.overdraft_allowed,
        });
      }
      const movement = await this.insertMovement(client, {
        accountId: account.id,
        direction,
        amount,
        currencyCode: account.currency_code,
        occurredAt: new Date().toISOString(),
        idempotencyKey: input.idempotencyKey,
        reference: input.reference,
        originKind: TREASURY_ORIGIN_KINDS.Reversal,
        originId: original.id,
        originReference: input.reason,
        actorIdentityId: input.actorIdentityId,
        transferId: null,
        reversesTransactionId: original.id,
      });
      const updated = await this.bumpAccount(client, account.id, input.actorIdentityId);
      await client.query('COMMIT');
      return { account: updated, movement, idempotent: false };
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        const original = await this.findTransactionById(input.transactionId);
        if (original) {
          const cached = await this.pool().query<FinancialTransactionRow>(
            `SELECT ${TX_RETURNING}
             FROM fin.financial_transactions
             WHERE account_id = $1 AND idempotency_key = $2`,
            [original.account_id, input.idempotencyKey],
          );
          const account = await this.findAccountById(original.account_id);
          if (cached.rows[0] && account) {
            return { account, movement: cached.rows[0], idempotent: true };
          }
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async reverseTransfer(input: ReverseTransferPersistenceInput): Promise<{
    transfer: TreasuryTransferRow;
    legs: FinancialTransactionRow[];
    fromAccount: FinancialAccountRow;
    toAccount: FinancialAccountRow;
    idempotent: boolean;
  }> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const originalResult = await client.query<TreasuryTransferRow>(
        `SELECT ${TRANSFER_RETURNING} FROM fin.treasury_transfers WHERE id = $1 FOR UPDATE`,
        [input.transferId],
      );
      const original = originalResult.rows[0];
      if (!original) {
        throw new TreasuryError('TREASURY_TRANSFER_NOT_FOUND');
      }
      if (original.kind === TREASURY_TRANSFER_KINDS.Reversal) {
        throw new TreasuryError('TREASURY_TRANSACTION_IMMUTABLE');
      }
      const existingReversal = await client.query<TreasuryTransferRow>(
        `SELECT ${TRANSFER_RETURNING} FROM fin.treasury_transfers WHERE reverses_transfer_id = $1`,
        [original.id],
      );
      if (existingReversal.rows[0] && existingReversal.rows[0].idempotency_key !== input.idempotencyKey) {
        throw new TreasuryError('TREASURY_ALREADY_REVERSED');
      }

      const [firstId, secondId] =
        compareIds(original.from_account_id, original.to_account_id) < 0
          ? [original.from_account_id, original.to_account_id]
          : [original.to_account_id, original.from_account_id];
      await this.lockAccount(client, firstId);
      await this.lockAccount(client, secondId);
      const fromAccount = await this.lockAccount(client, original.from_account_id);
      const toAccount = await this.lockAccount(client, original.to_account_id);

      const cached = await client.query<TreasuryTransferRow>(
        `SELECT ${TRANSFER_RETURNING}
         FROM fin.treasury_transfers
         WHERE from_account_id = $1 AND idempotency_key = $2`,
        [original.from_account_id, input.idempotencyKey],
      );
      if (cached.rows[0]) {
        const legs = await this.listLegsWithClient(client, cached.rows[0].id);
        await client.query('COMMIT');
        return {
          transfer: cached.rows[0],
          legs,
          fromAccount,
          toAccount,
          idempotent: true,
        };
      }

      assertAccountActive(fromAccount.lifecycle);
      assertAccountActive(toAccount.lifecycle);
      if (classifyRowVersion(fromAccount, input.rowVersionFrom) === 'mismatch') {
        throw new TreasuryError('TREASURY_VERSION_CONFLICT');
      }
      if (classifyRowVersion(toAccount, input.rowVersionTo) === 'mismatch') {
        throw new TreasuryError('TREASURY_VERSION_CONFLICT');
      }

      const destPosted = await this.lockMovements(client, toAccount.id);
      assertSufficientBalance({
        currentBalance: derivedBalance(toPosted(destPosted)),
        debitAmount: original.amount,
        overdraftAllowed: toAccount.overdraft_allowed,
      });

      const reversalId = randomUUID();
      const reversal = await client.query<TreasuryTransferRow>(
        `INSERT INTO fin.treasury_transfers (
           id, from_account_id, to_account_id, kind, amount, currency_code, occurred_at,
           idempotency_key, reference, origin_kind, origin_id, origin_reference,
           reverses_transfer_id, actor_identity_id
         )
         VALUES (
           $1, $2, $3, $4::fin.treasury_transfer_kind, $5, $6, NOW(), $7, $8,
           $9::fin.treasury_origin_kind, $10, $11, $12, $13
         )
         RETURNING ${TRANSFER_RETURNING}`,
        [
          reversalId,
          original.from_account_id,
          original.to_account_id,
          TREASURY_TRANSFER_KINDS.Reversal,
          original.amount,
          original.currency_code,
          input.idempotencyKey,
          input.reference,
          TREASURY_ORIGIN_KINDS.Reversal,
          original.id,
          input.reason,
          original.id,
          input.actorIdentityId,
        ],
      );

      const originalLegs = await this.listLegsWithClient(client, original.id);
      const debitLeg = originalLegs.find((item) => item.direction === FINANCIAL_DIRECTIONS.Debit);
      const creditLeg = originalLegs.find((item) => item.direction === FINANCIAL_DIRECTIONS.Credit);
      if (!debitLeg || !creditLeg || !moneyEqual(debitLeg.amount, creditLeg.amount)) {
        throw new TreasuryError('TREASURY_UNBALANCED_TRANSFER');
      }

      const restore = await this.insertMovement(client, {
        accountId: fromAccount.id,
        direction: FINANCIAL_DIRECTIONS.Credit,
        amount: original.amount,
        currencyCode: fromAccount.currency_code,
        occurredAt: new Date().toISOString(),
        idempotencyKey: `${input.idempotencyKey}:credit`,
        reference: input.reference,
        originKind: TREASURY_ORIGIN_KINDS.Reversal,
        originId: original.id,
        originReference: input.reason,
        actorIdentityId: input.actorIdentityId,
        transferId: reversalId,
        reversesTransactionId: debitLeg.id,
      });
      const unwind = await this.insertMovement(client, {
        accountId: toAccount.id,
        direction: FINANCIAL_DIRECTIONS.Debit,
        amount: original.amount,
        currencyCode: toAccount.currency_code,
        occurredAt: new Date().toISOString(),
        idempotencyKey: `${input.idempotencyKey}:debit`,
        reference: input.reference,
        originKind: TREASURY_ORIGIN_KINDS.Reversal,
        originId: original.id,
        originReference: input.reason,
        actorIdentityId: input.actorIdentityId,
        transferId: reversalId,
        reversesTransactionId: creditLeg.id,
      });

      const updatedFrom = await this.bumpAccount(client, fromAccount.id, input.actorIdentityId);
      const updatedTo = await this.bumpAccount(client, toAccount.id, input.actorIdentityId);
      await client.query('COMMIT');
      return {
        transfer: reversal.rows[0]!,
        legs: [restore, unwind],
        fromAccount: updatedFrom,
        toAccount: updatedTo,
        idempotent: false,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async lockAccount(client: PoolClient, accountId: string): Promise<FinancialAccountRow> {
    const result = await client.query<FinancialAccountRow>(
      `SELECT ${ACCOUNT_RETURNING} FROM fin.financial_accounts WHERE id = $1 FOR UPDATE`,
      [accountId],
    );
    if (!result.rows[0]) {
      throw new TreasuryError('TREASURY_ACCOUNT_NOT_FOUND');
    }
    return result.rows[0];
  }

  private async lockMovements(
    client: PoolClient,
    accountId: string,
  ): Promise<FinancialTransactionRow[]> {
    const result = await client.query<FinancialTransactionRow>(
      `SELECT ${TX_RETURNING}
       FROM fin.financial_transactions
       WHERE account_id = $1 AND status = $2
       FOR UPDATE`,
      [accountId, FINANCIAL_TRANSACTION_STATUSES.Posted],
    );
    return result.rows;
  }

  private async bumpAccount(
    client: PoolClient,
    accountId: string,
    actorIdentityId: string,
  ): Promise<FinancialAccountRow> {
    const result = await client.query<FinancialAccountRow>(
      `UPDATE fin.financial_accounts
       SET row_version = row_version + 1, updated_at = NOW(), updated_by_identity_id = $2
       WHERE id = $1
       RETURNING ${ACCOUNT_RETURNING}`,
      [accountId, actorIdentityId],
    );
    return result.rows[0]!;
  }

  private async insertMovement(
    client: PoolClient,
    input: {
      accountId: string;
      direction: string;
      amount: string;
      currencyCode: string;
      occurredAt: string;
      idempotencyKey: string;
      reference: string;
      originKind: string;
      originId: string;
      originReference: string;
      actorIdentityId: string;
      transferId: string | null;
      reversesTransactionId: string | null;
    },
  ): Promise<FinancialTransactionRow> {
    const result = await client.query<FinancialTransactionRow>(
      `INSERT INTO fin.financial_transactions (
         account_id, direction, amount, currency_code, occurred_at, status, idempotency_key,
         reference, origin_kind, origin_id, origin_reference, transfer_id, reverses_transaction_id,
         actor_identity_id
       )
       VALUES (
         $1, $2::fin.financial_direction, $3, $4, $5::timestamptz, $6::fin.financial_transaction_status,
         $7, $8, $9::fin.treasury_origin_kind, $10, $11, $12, $13, $14
       )
       RETURNING ${TX_RETURNING}`,
      [
        input.accountId,
        input.direction,
        input.amount,
        input.currencyCode,
        input.occurredAt,
        FINANCIAL_TRANSACTION_STATUSES.Posted,
        input.idempotencyKey,
        input.reference,
        input.originKind,
        input.originId,
        input.originReference,
        input.transferId,
        input.reversesTransactionId,
        input.actorIdentityId,
      ],
    );
    return result.rows[0]!;
  }

  private async listLegsWithClient(
    client: PoolClient,
    transferId: string,
  ): Promise<FinancialTransactionRow[]> {
    const result = await client.query<FinancialTransactionRow>(
      `SELECT ${TX_RETURNING} FROM fin.financial_transactions WHERE transfer_id = $1`,
      [transferId],
    );
    return result.rows;
  }

  private async findBankWithClient(client: PoolClient, accountId: string): Promise<BankAccountRow | null> {
    const result = await client.query<BankAccountRow>(
      `SELECT financial_account_id, bank_code, agency, account_number
       FROM fin.bank_accounts WHERE financial_account_id = $1`,
      [accountId],
    );
    return result.rows[0] ?? null;
  }

  private async findCashWithClient(client: PoolClient, accountId: string): Promise<CashAccountRow | null> {
    const result = await client.query<CashAccountRow>(
      `SELECT financial_account_id, location_code FROM fin.cash_accounts WHERE financial_account_id = $1`,
      [accountId],
    );
    return result.rows[0] ?? null;
  }
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function moneyEqual(left: string, right: string): boolean {
  return compareMoneyAmounts(left, right) === 0;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
