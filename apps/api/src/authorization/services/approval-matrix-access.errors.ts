import { HttpStatus } from '@nestjs/common';
import { ApprovalMatrixError } from '../domain/approval-matrix';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';

export function mapApprovalMatrixError(error: unknown): AuthzHttpException {
  if (error instanceof AuthzHttpException) {
    return error;
  }
  if (!(error instanceof ApprovalMatrixError)) {
    return new AuthzHttpException(
      HttpStatus.BAD_REQUEST,
      AUTHZ_ERROR_CODES.VALIDATION_FAILED,
      'Approval matrix operation is not allowed.',
    );
  }
  switch (error.code) {
    case 'APPROVAL_MATRIX_NOT_FOUND':
      return new AuthzHttpException(
        HttpStatus.NOT_FOUND,
        AUTHZ_ERROR_CODES.APPROVAL_NOT_FOUND,
        'Approval matrix not found.',
      );
    case 'APPROVAL_MATRIX_VERSION_CONFLICT':
      return new AuthzHttpException(
        HttpStatus.CONFLICT,
        AUTHZ_ERROR_CODES.APPROVAL_VERSION_CONFLICT,
        'Approval matrix version conflict.',
      );
    case 'APPROVAL_MATRIX_SELF_APPROVAL':
      return new AuthzHttpException(
        HttpStatus.FORBIDDEN,
        AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL,
        'Self-approval is forbidden.',
      );
    case 'APPROVAL_MATRIX_LIMIT_EXCEEDED':
      return new AuthzHttpException(
        HttpStatus.FORBIDDEN,
        AUTHZ_ERROR_CODES.APPROVAL_LIMIT_EXCEEDED,
        'Amount exceeds the published approval limit.',
      );
    case 'APPROVAL_MATRIX_NOT_PUBLISHED':
      return new AuthzHttpException(
        HttpStatus.FORBIDDEN,
        AUTHZ_ERROR_CODES.APPROVAL_NOT_PUBLISHED,
        'No published approval matrix covers this operation.',
      );
    case 'APPROVAL_MATRIX_DENIED':
      return new AuthzHttpException(
        HttpStatus.FORBIDDEN,
        AUTHZ_ERROR_CODES.DENIED,
        'Approval is denied by the published matrix.',
      );
    case 'APPROVAL_MATRIX_INVALID_STATE':
      return new AuthzHttpException(
        HttpStatus.CONFLICT,
        AUTHZ_ERROR_CODES.APPROVAL_INVALID_STATE,
        'Approval matrix status does not allow this operation.',
      );
    default:
      return new AuthzHttpException(
        HttpStatus.BAD_REQUEST,
        AUTHZ_ERROR_CODES.VALIDATION_FAILED,
        'Approval matrix operation is not allowed.',
      );
  }
}
