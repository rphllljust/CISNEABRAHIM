import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { ApprovalMatrixAccessService } from '../../authorization/services/approval-matrix-access.service';
import { APPROVAL_OPERATIONS } from '../../authorization/domain/approval-matrix';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid } from '../../platform/kernel/uuid';
import { ExpenseError, assertExpenseNotSelfApproval } from '../domain/expense';
import { ExpenseFailureInjection } from '../domain/expense-failure-injection';
import {
  validateCreateExpenseInput,
  validateExpenseVersionInput,
  validateRejectExpenseInput,
  type CreateExpenseInput,
  type ExpenseVersionInput,
  type RejectExpenseInput,
} from '../domain/expense.validation';
import { ExpenseRepository } from '../repositories/expense.repository';
import { toExpenseResponse, type ExpenseResponse } from '../serializers/expense-response.serializer';
import { ExpenseAccessAuthz } from './expense-access.authz';
import { mapExpenseError } from './expense-access.errors';

@Injectable()
export class ExpenseAccessService {
  constructor(
    private readonly repository: ExpenseRepository,
    private readonly authz: ExpenseAccessAuthz,
    private readonly securityAudit: SecurityAuditService,
    private readonly approvalMatrix: ApprovalMatrixAccessService,
    private readonly failures: ExpenseFailureInjection,
  ) {}

  async create(actor: IdentityAuthzContext, input: CreateExpenseInput): Promise<ExpenseResponse> {
    try {
      await this.authz.assertExpenseAction(actor, AUTHZ_ACTIONS.FinanceExpenseCreate, {
        id: actor.identityId,
        unitId: input.unitId,
      });
      const validated = validateCreateExpenseInput(input);
      if (validated.receiptDocumentId) {
        const exists = await this.repository.documentExists(validated.receiptDocumentId);
        if (!exists) {
          throw new ExpenseError('EXPENSE_RECEIPT_NOT_FOUND');
        }
      }
      // Replay only an expense previously created by THIS requester in THIS
      // unit — a globally-reused idempotency key must never disclose another
      // requester's expense (idempotency-key IDOR).
      const existing = await this.repository.findOwnedByIdempotencyKey(
        validated.idempotencyKey,
        actor.identityId,
        validated.unitId,
      );
      if (existing) {
        return toExpenseResponse(existing);
      }
      const created = await this.repository.create({
        ...validated,
        requesterIdentityId: actor.identityId,
        actorIdentityId: actor.identityId,
      });
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.FinanceExpenseCreate, created.expense.id);
      return toExpenseResponse(created);
    } catch (error) {
      throw mapExpenseError(error);
    }
  }

  async get(actor: IdentityAuthzContext, expenseId: string): Promise<ExpenseResponse> {
    assertUuid(expenseId, 'expenseId');
    try {
      const current = await this.repository.findById(expenseId);
      if (!current) {
        throw new ExpenseError('EXPENSE_NOT_FOUND');
      }
      await this.authz.assertExpenseAction(actor, AUTHZ_ACTIONS.FinanceExpenseRead, {
        id: current.expense.id,
        unitId: current.expense.unit_id,
      });
      return toExpenseResponse(current);
    } catch (error) {
      throw mapExpenseError(error);
    }
  }

  async submit(
    actor: IdentityAuthzContext,
    expenseId: string,
    input: ExpenseVersionInput,
  ): Promise<ExpenseResponse> {
    assertUuid(expenseId, 'expenseId');
    try {
      const validated = validateExpenseVersionInput(input);
      const current = await this.requireExpense(expenseId);
      await this.authz.assertExpenseAction(actor, AUTHZ_ACTIONS.FinanceExpenseSubmit, {
        id: current.expense.id,
        unitId: current.expense.unit_id,
      });
      const submitted = await this.repository.submit(expenseId, validated.version);
      if (submitted === null) {
        throw new ExpenseError('EXPENSE_NOT_FOUND');
      }
      if (submitted === 'VERSION_CONFLICT') {
        throw new ExpenseError('EXPENSE_VERSION_CONFLICT');
      }
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.FinanceExpenseSubmit, expenseId);
      return toExpenseResponse(submitted);
    } catch (error) {
      throw mapExpenseError(error);
    }
  }

  async approve(
    actor: IdentityAuthzContext,
    expenseId: string,
    input: ExpenseVersionInput,
  ): Promise<ExpenseResponse> {
    assertUuid(expenseId, 'expenseId');
    try {
      const validated = validateExpenseVersionInput(input);
      const current = await this.requireExpense(expenseId);
      await this.authz.assertExpenseAction(actor, AUTHZ_ACTIONS.FinanceExpenseApprove, {
        id: current.expense.id,
        unitId: current.expense.unit_id,
      });
      assertExpenseNotSelfApproval(actor.identityId, current.expense.requester_identity_id);
      const decision = await this.approvalMatrix.evaluate(actor, {
        requesterIdentityId: current.expense.requester_identity_id,
        operation: APPROVAL_OPERATIONS.Expense,
        capability: 'expense.approve',
        amount: current.expense.total_amount,
        scopeType: AUTHZ_SCOPES.Global,
      });
      const decided = await this.repository.decide(
        {
          expenseId,
          expectedVersion: validated.version,
          decision: 'APPROVED',
          actorIdentityId: actor.identityId,
          approvalRuleId: decision.ruleId,
          reason: null,
          openPayable: {
            unitId: current.expense.unit_id,
            counterpartyId: current.expense.requester_identity_id,
            expenseCategoryId: current.expense.expense_category_id,
            costCenterId: current.expense.cost_center_id,
            costCenterCode: current.expense.cost_center_code,
            principal: current.expense.total_amount,
            currencyCode: current.expense.currency_code,
            dueDate: String(current.expense.due_date).slice(0, 10),
            paymentTerms: current.expense.payment_terms,
          },
        },
        this.failures,
      );
      return this.finishDecision(actor, expenseId, decided, SECURITY_AUDIT_ACTIONS.FinanceExpenseApprove);
    } catch (error) {
      throw mapExpenseError(error);
    }
  }

  async reject(
    actor: IdentityAuthzContext,
    expenseId: string,
    input: RejectExpenseInput,
  ): Promise<ExpenseResponse> {
    assertUuid(expenseId, 'expenseId');
    try {
      const validated = validateRejectExpenseInput(input);
      const current = await this.requireExpense(expenseId);
      await this.authz.assertExpenseAction(actor, AUTHZ_ACTIONS.FinanceExpenseReject, {
        id: current.expense.id,
        unitId: current.expense.unit_id,
      });
      assertExpenseNotSelfApproval(actor.identityId, current.expense.requester_identity_id);
      const decided = await this.repository.decide({
        expenseId,
        expectedVersion: validated.version,
        decision: 'REJECTED',
        actorIdentityId: actor.identityId,
        approvalRuleId: null,
        reason: validated.reason,
      });
      return this.finishDecision(actor, expenseId, decided, SECURITY_AUDIT_ACTIONS.FinanceExpenseReject);
    } catch (error) {
      throw mapExpenseError(error);
    }
  }

  private async finishDecision(
    actor: IdentityAuthzContext,
    expenseId: string,
    decided: Awaited<ReturnType<ExpenseRepository['decide']>>,
    action: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
  ): Promise<ExpenseResponse> {
    if (decided === null) {
      throw new ExpenseError('EXPENSE_NOT_FOUND');
    }
    if (decided === 'VERSION_CONFLICT') {
      throw new ExpenseError('EXPENSE_VERSION_CONFLICT');
    }
    if (decided === 'REPLAY') {
      const current = await this.requireExpense(expenseId);
      return toExpenseResponse(current);
    }
    await this.audit(actor, action, expenseId);
    return toExpenseResponse(decided);
  }

  private async requireExpense(expenseId: string) {
    const current = await this.repository.findById(expenseId);
    if (!current) {
      throw new ExpenseError('EXPENSE_NOT_FOUND');
    }
    return current;
  }

  private async audit(
    actor: IdentityAuthzContext,
    action: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
    resourceId: string,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceExpense,
      resourceId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      metadata: {},
    });
  }
}
