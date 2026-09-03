import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { GatedModuleId } from './release-1-scope';

export const RELEASE_SCOPE_ERROR_CODES = {
  FEATURE_DISABLED: 'FEATURE_DISABLED',
} as const;

export class ReleaseScopeHttpException extends HttpException {
  constructor(moduleId: GatedModuleId) {
    super(
      buildDomainHttpExceptionBody(
        RELEASE_SCOPE_ERROR_CODES.FEATURE_DISABLED,
        `Module '${moduleId}' is not enabled in Release 1.`,
      ),
      HttpStatus.FORBIDDEN,
    );
  }
}
