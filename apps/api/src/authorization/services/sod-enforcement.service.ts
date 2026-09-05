import { HttpStatus, Injectable } from '@nestjs/common';
import type { IdentityAuthzContext } from '../types/authz-decision';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { ApprovalMatrixError } from '../domain/approval-matrix';
import {
  SOD_NON_MONETARY_AMOUNT,
  SodError,
  assertSodOriginator,
  assertSodDistinctActors,
  type SodDuty,
} from '../domain/segregation-of-duties';
import { ApprovalMatrixAccessService } from './approval-matrix-access.service';

export type SodEnforcementInput = {
  duty: SodDuty;
  originatorIdentityId: string | null | undefined;
  amount?: string;
  scopeType: string;
  scopeAnchor?: string | null;
};

@Injectable()
export class SodEnforcementService {
  constructor(private readonly approvalMatrix: ApprovalMatrixAccessService) {}

  async enforce(
    actor: IdentityAuthzContext,
    input: SodEnforcementInput,
  ): Promise<{ ruleId: string }> {
    let originatorIdentityId: string;
    try {
      originatorIdentityId = assertSodOriginator(input.originatorIdentityId);
      assertSodDistinctActors(actor.identityId, originatorIdentityId);
    } catch (error) {
      throw mapSodError(error);
    }
    const decision = await this.approvalMatrix.evaluate(actor, {
      requesterIdentityId: originatorIdentityId,
      operation: input.duty.approvalOperation,
      capability: input.duty.capability,
      amount: input.amount?.trim() || SOD_NON_MONETARY_AMOUNT,
      scopeType: input.scopeType,
      scopeAnchor: input.scopeAnchor,
    });
    return { ruleId: decision.ruleId };
  }
}

function mapSodError(error: unknown): AuthzHttpException {
  if (error instanceof AuthzHttpException) {
    return error;
  }
  if (error instanceof SodError && error.code === 'SOD_ORIGINATOR_MISSING') {
    return new AuthzHttpException(
      HttpStatus.FORBIDDEN,
      AUTHZ_ERROR_CODES.SOD_DUTY_CONFLICT,
      'Segregation of duties cannot be evaluated without an originator identity.',
    );
  }
  if (error instanceof ApprovalMatrixError && error.code === 'APPROVAL_MATRIX_SELF_APPROVAL') {
    return new AuthzHttpException(
      HttpStatus.FORBIDDEN,
      AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL,
      'Self-approval is forbidden.',
    );
  }
  return new AuthzHttpException(
    HttpStatus.FORBIDDEN,
    AUTHZ_ERROR_CODES.SOD_DUTY_CONFLICT,
    'Segregation of duties forbids this operation.',
  );
}
