import { HttpStatus, Injectable } from '@nestjs/common';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../types/authz-resources';
import {
  ANCHORED_SCOPE_TYPES,
  AUTHZ_SCOPES,
  type AuthzScopeType,
} from '../types/authz-scopes';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import { ScopeContextRepository } from '../repositories/scope-context.repository';
import { PolicyDecisionPointService } from './policy-decision-point.service';
import type { IdentityAuthzContext } from '../types/authz-decision';
import type { AuthzAction } from '../types/authz-actions';
import type { AuthzResourceType } from '../types/authz-resources';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { toGrantResponse, type GrantResponseV1 } from '../serializers/grant-response.serializer';
import { grantMatchesResourceContext } from '../scope/scope-matcher';

export type CreateGrantCommand = {
  identityId: string;
  action: AuthzAction;
  resourceType: AuthzResourceType;
  resourceId?: string;
  scopeType: AuthzScopeType;
  constraints?: Record<string, unknown>;
  validUntil?: string;
};

const SELF_ESCALATION_SCOPES = new Set<AuthzScopeType>([
  AUTHZ_SCOPES.Global,
  AUTHZ_SCOPES.Financial,
  AUTHZ_SCOPES.Unit,
  AUTHZ_SCOPES.Client,
  AUTHZ_SCOPES.Contract,
  AUTHZ_SCOPES.Document,
]);

@Injectable()
export class GrantAdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly repository: AuthorizationRepository,
    private readonly scopeContextRepository: ScopeContextRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async createGrant(
    actor: IdentityAuthzContext,
    command: CreateGrantCommand,
  ): Promise<GrantResponseV1> {
    await this.assertAllowed(actor, AUTHZ_ACTIONS.GrantCreate, AUTHZ_RESOURCE_TYPES.Grant);

    this.assertGrantShape(command);
    this.assertTechnicalGrantIsolation(command);
    await this.assertScopeRefExists(command);
    await this.assertNoSelfEscalation(actor, command);

    const pool = this.databaseService.getConnection()?.pool;
    if (!pool) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const grantId = await this.repository.insertGrant(client, {
        identityId: command.identityId,
        action: command.action,
        resourceType: command.resourceType,
        resourceId: command.resourceId,
        scopeType: command.scopeType,
        constraints: command.constraints,
        grantedByIdentityId: actor.identityId,
        validUntil: command.validUntil,
      });
      await client.query('COMMIT');

      const grant = await this.repository.getGrantById(grantId);
      if (!grant) {
        throw new Error('grant not found after insert');
      }
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.AuthzGrantCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Grant,
        resourceId: grantId,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        scopeType: command.scopeType,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
        metadata: {
          target_identity_id: command.identityId,
          action: command.action,
          resource_type: command.resourceType,
        },
      });
      return toGrantResponse(grant);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeGrant(actor: IdentityAuthzContext, grantId: string): Promise<{ success: true }> {
    await this.assertAllowed(actor, AUTHZ_ACTIONS.GrantRevoke, AUTHZ_RESOURCE_TYPES.Grant);

    const pool = this.databaseService.getConnection()?.pool;
    if (!pool) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const revoked = await this.repository.revokeGrantForUpdate(
        client,
        grantId,
        actor.identityId,
      );
      await client.query('COMMIT');
      if (!revoked) {
        throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
      }
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.AuthzGrantRevoke,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Grant,
        resourceId: grantId,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      });
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async assertAllowed(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    resourceType: AuthzResourceType,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(actor, { action, resourceType });
    if (decision.result === 'DENY') {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }
  }

  private assertGrantShape(command: CreateGrantCommand): void {
    if (command.scopeType === AUTHZ_SCOPES.Global && command.resourceId) {
      throw new AuthzHttpException(
        HttpStatus.BAD_REQUEST,
        AUTHZ_ERROR_CODES.VALIDATION_FAILED,
        'GLOBAL scope cannot include resourceId.',
      );
    }

    if (ANCHORED_SCOPE_TYPES.has(command.scopeType) && !command.resourceId) {
      throw new AuthzHttpException(
        HttpStatus.BAD_REQUEST,
        AUTHZ_ERROR_CODES.VALIDATION_FAILED,
        'Anchored scope requires resourceId.',
      );
    }
  }

  private async assertScopeRefExists(command: CreateGrantCommand): Promise<void> {
    if (!ANCHORED_SCOPE_TYPES.has(command.scopeType) || !command.resourceId) {
      return;
    }

    const exists = await this.scopeContextRepository.scopeRefExists(
      command.scopeType,
      command.resourceId,
    );
    if (!exists) {
      throw new AuthzHttpException(
        HttpStatus.BAD_REQUEST,
        AUTHZ_ERROR_CODES.VALIDATION_FAILED,
        'Scope reference not found.',
      );
    }
  }

  private async assertNoSelfEscalation(
    actor: IdentityAuthzContext,
    command: CreateGrantCommand,
  ): Promise<void> {
    if (command.identityId !== actor.identityId) {
      return;
    }

    if (command.scopeType === AUTHZ_SCOPES.Global) {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }

    if (!SELF_ESCALATION_SCOPES.has(command.scopeType)) {
      return;
    }

    const actorGrants = await this.repository.findActiveGrants(
      actor.identityId,
      command.action,
      command.resourceType,
    );

    const alreadyHasScope = actorGrants.some((grant) =>
      grantMatchesResourceContext({
        grant,
        identityId: actor.identityId,
        context: {
          unitId: command.scopeType === AUTHZ_SCOPES.Unit ? command.resourceId : undefined,
          clientId: command.scopeType === AUTHZ_SCOPES.Client ? command.resourceId : undefined,
          contractId:
            command.scopeType === AUTHZ_SCOPES.Contract || command.scopeType === AUTHZ_SCOPES.Financial
              ? command.resourceId
              : undefined,
          documentId: command.scopeType === AUTHZ_SCOPES.Document ? command.resourceId : undefined,
          isFinancial: command.scopeType === AUTHZ_SCOPES.Financial ? true : undefined,
        },
      }),
    );

    if (!alreadyHasScope) {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }
  }

  private assertTechnicalGrantIsolation(command: CreateGrantCommand): void {
    if (command.scopeType === AUTHZ_SCOPES.Platform) {
      const allowed =
        command.resourceType === AUTHZ_RESOURCE_TYPES.Platform ||
        command.resourceType === AUTHZ_RESOURCE_TYPES.Probe ||
        command.resourceType === AUTHZ_RESOURCE_TYPES.Grant;
      if (!allowed) {
        throw new AuthzHttpException(
          HttpStatus.BAD_REQUEST,
          AUTHZ_ERROR_CODES.VALIDATION_FAILED,
          'Invalid grant scope for platform technical grant.',
        );
      }
    }

    if (
      command.action.startsWith('platform:') &&
      command.scopeType !== AUTHZ_SCOPES.Platform &&
      command.scopeType !== AUTHZ_SCOPES.Global
    ) {
      throw new AuthzHttpException(
        HttpStatus.BAD_REQUEST,
        AUTHZ_ERROR_CODES.VALIDATION_FAILED,
        'Invalid platform action scope.',
      );
    }
  }
}
