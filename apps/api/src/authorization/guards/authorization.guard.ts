import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../auth/guards/jwt-auth.guard';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import {
  AUTHZ_REQUIREMENT_KEY,
  type AuthzRequirement,
} from '../decorators/require-authz.decorator';
import { PolicyDecisionPointService } from '../services/policy-decision-point.service';
import { resolveCorrelationId } from '../../infrastructure/http/correlation-id';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<AuthzRequirement | undefined>(
      AUTHZ_REQUIREMENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      throw new AuthzHttpException(
        HttpStatus.FORBIDDEN,
        AUTHZ_ERROR_CODES.DENIED,
        'Access denied.',
      );
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = request.auth;
    const correlationId = resolveCorrelationId(request);

    if (!auth) {
      throw new AuthzHttpException(
        HttpStatus.UNAUTHORIZED,
        AUTHZ_ERROR_CODES.UNAUTHENTICATED,
        'Authentication required.',
        correlationId,
      );
    }

    const decision = await this.policyDecisionPoint.decide(
      { identityId: auth.sub, sessionId: auth.sid },
      {
        action: requirement.action,
        resourceType: requirement.resourceType,
        context: { ownerIdentityId: auth.sub },
      },
      { correlationId },
    );

    if (decision.result === 'DENY') {
      throw new AuthzHttpException(
        HttpStatus.FORBIDDEN,
        AUTHZ_ERROR_CODES.DENIED,
        'Access denied.',
        correlationId,
      );
    }

    return true;
  }
}
