import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid } from '../../platform/kernel/uuid';
import { TREASURY_ORIGIN_KINDS, TreasuryError } from '../domain/treasury';
import {
  validateOpenFinancialAccountInput,
  validatePostTreasuryMovementInput,
  validateReverseTreasuryInput,
  validateTransferTreasuryInput,
  type OpenFinancialAccountInput,
  type PostTreasuryMovementInput,
  type ReverseTreasuryInput,
  type TransferTreasuryInput,
} from '../domain/treasury.validation';
import { TreasuryRepository } from '../repositories/treasury.repository';
import type { FinancialAccountRow } from '../repositories/treasury.repository.types';
import {
  toAccountResponse,
  toReconciliationResponse,
  toTransferResponse,
  type FinancialAccountResponse,
  type TreasuryReconciliationResponse,
  type TreasuryTransferResponse,
} from '../serializers/treasury-response.serializer';
import { TreasuryAccessAuthz } from './treasury-access.authz';
import { mapTreasuryDomainError, treasuryAccountNotFound } from './treasury-access.errors';

@Injectable()
export class TreasuryAccessService {
  constructor(
    private readonly repository: TreasuryRepository,
    private readonly authz: TreasuryAccessAuthz,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async openAccount(
    actor: IdentityAuthzContext,
    input: OpenFinancialAccountInput,
  ): Promise<FinancialAccountResponse> {
    let validated: ReturnType<typeof validateOpenFinancialAccountInput>;
    try {
      validated = validateOpenFinancialAccountInput(input);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryAccountOpen, {
      id: actor.identityId,
      unitId: validated.unitId,
    });
    try {
      const opened = await this.repository.openAccount({
        unitId: validated.unitId,
        kind: validated.kind,
        code: validated.code,
        name: validated.name,
        currencyCode: validated.currencyCode,
        overdraftAllowed: validated.overdraftAllowed === true,
        actorIdentityId: actor.identityId,
        bank: validated.bank,
        cash: validated.cash,
        opening: validated.openingAmount
          ? {
              amount: validated.openingAmount,
              idempotencyKey: `opening:${validated.unitId}:${validated.code}`,
              reference: 'OPENING',
              originId: actor.identityId,
            }
          : undefined,
      });
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.FinanceTreasuryAccountOpen,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceTreasury,
        resourceId: opened.account.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { kind: opened.account.kind, code: opened.account.code },
      });
      return this.toAccount(opened.account);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
  }

  async list(actor: IdentityAuthzContext): Promise<FinancialAccountResponse[]> {
    const rows = await this.repository.listAccounts();
    const details: FinancialAccountResponse[] = [];
    for (const row of rows) {
      try {
        await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryList, {
          id: row.id,
          unitId: row.unit_id,
        });
      } catch {
        continue;
      }
      details.push(await this.toAccount(row));
    }
    return details;
  }

  async getById(actor: IdentityAuthzContext, accountId: string): Promise<FinancialAccountResponse> {
    assertUuid(accountId, 'accountId');
    const row = await this.repository.findAccountById(accountId);
    if (!row) {
      throw treasuryAccountNotFound();
    }
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryRead, {
      id: row.id,
      unitId: row.unit_id,
    });
    return this.toAccount(row);
  }

  async reconcile(
    actor: IdentityAuthzContext,
    accountId: string,
  ): Promise<TreasuryReconciliationResponse> {
    const account = await this.getById(actor, accountId);
    const movements = await this.repository.listMovements(account.id);
    return toReconciliationResponse(account.id, movements);
  }

  async postMovement(
    actor: IdentityAuthzContext,
    accountId: string,
    input: PostTreasuryMovementInput,
  ): Promise<FinancialAccountResponse> {
    assertUuid(accountId, 'accountId');
    const row = await this.repository.findAccountById(accountId);
    if (!row) {
      throw treasuryAccountNotFound();
    }
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryPost, {
      id: row.id,
      unitId: row.unit_id,
    });
    try {
      const validated = validatePostTreasuryMovementInput(input);
      const posted = await this.repository.postMovement({
        accountId,
        direction: validated.direction,
        amount: validated.amount,
        rowVersion: validated.rowVersion,
        idempotencyKey: validated.idempotencyKey,
        reference: validated.reference,
        originKind: validated.originKind,
        originId: validated.originId,
        originReference: validated.originReference,
        occurredAt: validated.occurredAt ?? new Date().toISOString(),
        actorIdentityId: actor.identityId,
      });
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.FinanceTreasuryPost,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceTreasury,
        resourceId: accountId,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: {
          amount: validated.amount,
          direction: validated.direction,
          reference: validated.reference,
          originKind: validated.originKind,
          originId: validated.originId,
          movementId: posted.movement.id,
        },
      });
      return this.toAccount(posted.account);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
  }

  async transfer(
    actor: IdentityAuthzContext,
    input: TransferTreasuryInput,
  ): Promise<TreasuryTransferResponse> {
    let validated: ReturnType<typeof validateTransferTreasuryInput>;
    try {
      validated = validateTransferTreasuryInput(input);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
    const from = await this.repository.findAccountById(validated.fromAccountId);
    const to = await this.repository.findAccountById(validated.toAccountId);
    if (!from || !to) {
      throw treasuryAccountNotFound();
    }
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryTransfer, {
      id: from.id,
      unitId: from.unit_id,
    });
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryTransfer, {
      id: to.id,
      unitId: to.unit_id,
    });
    try {
      const transferred = await this.repository.transfer({
        fromAccountId: validated.fromAccountId,
        toAccountId: validated.toAccountId,
        amount: validated.amount,
        rowVersionFrom: validated.rowVersionFrom,
        rowVersionTo: validated.rowVersionTo,
        idempotencyKey: validated.idempotencyKey,
        reference: validated.reference,
        originId: validated.originId,
        originReference: validated.originReference,
        occurredAt: validated.occurredAt ?? new Date().toISOString(),
        actorIdentityId: actor.identityId,
      });
      if (!transferred.idempotent) {
        await this.securityAudit.record({
          actorIdentityId: actor.identityId,
          actorSessionId: actor.sessionId,
          action: SECURITY_AUDIT_ACTIONS.FinanceTreasuryTransfer,
          resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceTreasury,
          resourceId: transferred.transfer.id,
          outcome: SECURITY_AUDIT_OUTCOMES.Success,
          classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
          metadata: {
            fromAccountId: from.id,
            toAccountId: to.id,
            amount: validated.amount,
            reference: validated.reference,
            origin: TREASURY_ORIGIN_KINDS.Transfer,
          },
        });
      }
      return toTransferResponse(transferred.transfer, transferred.legs);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
  }

  async reverseMovement(
    actor: IdentityAuthzContext,
    transactionId: string,
    input: ReverseTreasuryInput,
  ): Promise<FinancialAccountResponse> {
    assertUuid(transactionId, 'transactionId');
    const movement = await this.repository.findTransactionById(transactionId);
    if (!movement) {
      throw mapTreasuryDomainError(new TreasuryError('TREASURY_TRANSACTION_NOT_FOUND'));
    }
    const row = await this.repository.findAccountById(movement.account_id);
    if (!row) {
      throw treasuryAccountNotFound();
    }
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryReverse, {
      id: row.id,
      unitId: row.unit_id,
    });
    try {
      const validated = validateReverseTreasuryInput(input);
      const reversed = await this.repository.reverseMovement({
        transactionId,
        amount: validated.amount,
        rowVersion: validated.rowVersion,
        idempotencyKey: validated.idempotencyKey,
        reference: validated.reference,
        reason: validated.reason,
        actorIdentityId: actor.identityId,
      });
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.FinanceTreasuryReverse,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceTreasury,
        resourceId: reversed.movement.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: {
          originalTransactionId: transactionId,
          amount: reversed.movement.amount,
          reference: validated.reference,
        },
      });
      return this.toAccount(reversed.account);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
  }

  async reverseTransfer(
    actor: IdentityAuthzContext,
    transferId: string,
    input: ReverseTreasuryInput & { rowVersionTo: number },
  ): Promise<TreasuryTransferResponse> {
    assertUuid(transferId, 'transferId');
    const transfer = await this.repository.findTransferById(transferId);
    if (!transfer) {
      throw mapTreasuryDomainError(new TreasuryError('TREASURY_TRANSFER_NOT_FOUND'));
    }
    const from = await this.repository.findAccountById(transfer.from_account_id);
    const to = await this.repository.findAccountById(transfer.to_account_id);
    if (!from || !to) {
      throw treasuryAccountNotFound();
    }
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryReverse, {
      id: from.id,
      unitId: from.unit_id,
    });
    // Reversing a transfer writes compensating legs to both accounts
    // (credit restoring the source, debit unwinding the destination), so the
    // actor must be authorized on the destination as well — mirroring transfer().
    await this.authz.assertTreasuryAction(actor, AUTHZ_ACTIONS.FinanceTreasuryReverse, {
      id: to.id,
      unitId: to.unit_id,
    });
    try {
      const validated = validateReverseTreasuryInput(input);
      const reversed = await this.repository.reverseTransfer({
        transferId,
        rowVersionFrom: validated.rowVersion,
        rowVersionTo: input.rowVersionTo,
        idempotencyKey: validated.idempotencyKey,
        reference: validated.reference,
        reason: validated.reason,
        actorIdentityId: actor.identityId,
      });
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.FinanceTreasuryReverse,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceTreasury,
        resourceId: reversed.transfer.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { originalTransferId: transferId, reference: validated.reference },
      });
      return toTransferResponse(reversed.transfer, reversed.legs);
    } catch (error) {
      throw mapTreasuryDomainError(error);
    }
  }

  private async toAccount(row: FinancialAccountRow): Promise<FinancialAccountResponse> {
    const [movements, bank, cash] = await Promise.all([
      this.repository.listMovements(row.id),
      this.repository.findBankAccount(row.id),
      this.repository.findCashAccount(row.id),
    ]);
    return toAccountResponse(row, movements, bank, cash);
  }
}
