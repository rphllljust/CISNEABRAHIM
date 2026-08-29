import { HttpStatus, Injectable } from '@nestjs/common';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../types/authz-resources';
import { AUTHZ_SCOPES } from '../types/authz-scopes';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import { PolicyDecisionPointService } from './policy-decision-point.service';
import type { IdentityAuthzContext } from '../types/authz-decision';
import type { AuthzAction } from '../types/authz-actions';
import type { AuthzResourceType } from '../types/authz-resources';
import type { AuthzScopeType } from '../types/authz-scopes';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { toGrantResponse, type GrantResponseV1 } from '../serializers/grant-response.serializer';

export type CreateGrantCommand = {
  identityId: string;
  action: AuthzAction;
  resourceType: AuthzResourceType;
  resourceId?: string;
  scopeType: AuthzScopeType;
  constraints?: Record<string, unknown>;
  validUntil?: string;
};

@Injectable()
export class GrantAdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly repository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async createGrant(
    actor: IdentityAuthzContext,
    command: CreateGrantCommand,
  ): Promise<GrantResponseV1> {
    await this.assertAllowed(actor, AUTHZ_ACTIONS.GrantCreate, AUTHZ_RESOURCE_TYPES.Grant);

    this.assertTechnicalGrantIsolation(command);

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

  /**
   * Administrador técnico (PLATFORM) não recebe escopo financeiro/operacional automaticamente.
   * Grants de plataforma ficam restritos a recursos platform:* e ações authz/platform.
   */
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
