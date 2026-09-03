import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../types/authz-resources';
import type { IdentityAuthzContext } from '../types/authz-decision';
import { assertUuid } from '../../platform/kernel/uuid';
import {
  APPROVAL_DENY_REASONS,
  ApprovalMatrixError,
  assertNotSelfApproval,
  decideApproval,
} from '../domain/approval-matrix';
import {
  validateAddApprovalRulesInput,
  validateAssignApprovalRoleInput,
  validateCreateApprovalMatrixInput,
  validateEvaluateApprovalInput,
  validatePublishApprovalMatrixInput,
  type AddApprovalRulesInput,
  type AssignApprovalRoleInput,
  type CreateApprovalMatrixInput,
  type EvaluateApprovalInput,
  type PublishApprovalMatrixInput,
} from '../domain/approval-matrix.validation';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import {
  ApprovalMatrixRepository,
  mapRepositoryOutcome,
  type ApprovalMatrixRow,
} from '../repositories/approval-matrix.repository';
import { assertPolicyAndGrantScope } from './domain-grant-authz.helper';
import { PolicyDecisionPointService } from './policy-decision-point.service';
import { mapApprovalMatrixError } from './approval-matrix-access.errors';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { HttpStatus } from '@nestjs/common';

export type ApprovalMatrixResponse = {
  id: string;
  code: string;
  currencyCode: string;
  publishedVersion: number | null;
  draftVersion: number;
  version: number;
};

export type ApprovalDecisionResponse = {
  allowed: true;
  matrixVersionCount: number;
  ruleId: string;
};

@Injectable()
export class ApprovalMatrixAccessService {
  constructor(
    private readonly repository: ApprovalMatrixRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateApprovalMatrixInput,
  ): Promise<ApprovalMatrixResponse> {
    try {
      await this.assertManage(actor);
      const validated = validateCreateApprovalMatrixInput(input);
      const created = await this.repository.create({
        ...validated,
        actorIdentityId: actor.identityId,
      });
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.ApprovalMatrixCreate, created.id, {
        code: created.code,
      });
      return toResponse(created);
    } catch (error) {
      throw mapApprovalMatrixError(error);
    }
  }

  async addRules(
    actor: IdentityAuthzContext,
    matrixId: string,
    input: AddApprovalRulesInput,
  ): Promise<ApprovalMatrixResponse> {
    assertUuid(matrixId, 'matrixId');
    try {
      await this.assertManage(actor);
      const validated = validateAddApprovalRulesInput(input);
      const updated = mapRepositoryOutcome(
        await this.repository.addRules({
          matrixId,
          expectedVersion: validated.version,
          rules: validated.rules,
        }),
      );
      return toResponse(updated);
    } catch (error) {
      throw mapApprovalMatrixError(error);
    }
  }

  async publish(
    actor: IdentityAuthzContext,
    matrixId: string,
    input: PublishApprovalMatrixInput,
  ): Promise<ApprovalMatrixResponse> {
    assertUuid(matrixId, 'matrixId');
    try {
      await this.assertManage(actor);
      const validated = validatePublishApprovalMatrixInput(input);
      const published = mapRepositoryOutcome(
        await this.repository.publish({
          matrixId,
          expectedVersion: validated.version,
          actorIdentityId: actor.identityId,
        }),
      );
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.ApprovalMatrixPublish, published.id, {
        publishedVersion: published.published_version,
      });
      return toResponse(published);
    } catch (error) {
      throw mapApprovalMatrixError(error);
    }
  }

  async amend(
    actor: IdentityAuthzContext,
    matrixId: string,
    input: PublishApprovalMatrixInput,
  ): Promise<ApprovalMatrixResponse> {
    assertUuid(matrixId, 'matrixId');
    try {
      await this.assertManage(actor);
      const validated = validatePublishApprovalMatrixInput(input);
      const amended = mapRepositoryOutcome(
        await this.repository.amend({
          matrixId,
          expectedVersion: validated.version,
          actorIdentityId: actor.identityId,
        }),
      );
      return toResponse(amended);
    } catch (error) {
      throw mapApprovalMatrixError(error);
    }
  }

  async assignRole(
    actor: IdentityAuthzContext,
    input: AssignApprovalRoleInput,
  ): Promise<{ id: string; identityId: string; roleCode: string }> {
    try {
      await this.assertManage(actor);
      const validated = validateAssignApprovalRoleInput(input);
      const assigned = await this.repository.assignRole(validated);
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.ApprovalRoleAssign, assigned.id, {
        roleCode: assigned.role_code,
        targetIdentityId: assigned.identity_id,
      });
      return {
        id: assigned.id,
        identityId: assigned.identity_id,
        roleCode: assigned.role_code,
      };
    } catch (error) {
      throw mapApprovalMatrixError(error);
    }
  }

  async evaluate(
    actor: IdentityAuthzContext,
    input: EvaluateApprovalInput,
  ): Promise<ApprovalDecisionResponse> {
    try {
      const validated = validateEvaluateApprovalInput(input);
      assertNotSelfApproval(actor.identityId, validated.requesterIdentityId);
      const [rules, assignments] = await Promise.all([
        this.repository.listPublishedRules(),
        this.repository.listAssignments(actor.identityId),
      ]);
      if (rules.length === 0) {
        throw new ApprovalMatrixError('APPROVAL_MATRIX_NOT_PUBLISHED');
      }
      const decision = decideApproval({
        request: validated,
        rules: rules.map((rule) => ({
          id: rule.id,
          operation: rule.operation,
          roleCode: rule.role_code,
          capability: rule.capability,
          scopeType: rule.scope_type,
          scopeAnchor: rule.scope_anchor,
          amountLimit: rule.amount_limit,
        })),
        assignments: assignments.map((assignment) => ({
          roleCode: assignment.role_code,
          scopeType: assignment.scope_type,
          scopeAnchor: assignment.scope_anchor,
        })),
      });
      if (!decision.allowed) {
        if (decision.reason === APPROVAL_DENY_REASONS.LimitExceeded) {
          throw new ApprovalMatrixError('APPROVAL_MATRIX_LIMIT_EXCEEDED');
        }
        throw new ApprovalMatrixError('APPROVAL_MATRIX_DENIED');
      }
      return {
        allowed: true,
        matrixVersionCount: rules.length,
        ruleId: decision.ruleId,
      };
    } catch (error) {
      throw mapApprovalMatrixError(error);
    }
  }

  private async assertManage(actor: IdentityAuthzContext): Promise<void> {
    await assertPolicyAndGrantScope(
      {
        authorizationRepository: this.authorizationRepository,
        policyDecisionPoint: this.policyDecisionPoint,
      },
      {
        actor,
        action: AUTHZ_ACTIONS.ApprovalMatrixManage,
        resourceType: AUTHZ_RESOURCE_TYPES.ApprovalMatrix,
        context: { resourceId: actor.identityId },
        onDenied: () =>
          new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.'),
      },
    );
  }

  private async audit(
    actor: IdentityAuthzContext,
    action: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
    resourceId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ApprovalMatrix,
      resourceId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      metadata,
    });
  }
}

function toResponse(row: ApprovalMatrixRow): ApprovalMatrixResponse {
  return {
    id: row.id,
    code: row.code,
    currencyCode: row.currency_code,
    publishedVersion: row.published_version,
    draftVersion: row.draft_version,
    version: row.version,
  };
}
