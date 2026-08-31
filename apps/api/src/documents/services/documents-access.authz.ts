import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { toResourceContextFromDocument } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { DocumentRow } from '../repositories/documents.repository';
import { documentsAccessDenied } from './documents-access.errors';

@Injectable()
export class DocumentsAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertCreateAction(actor: IdentityAuthzContext, unitId: string): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.DocumentsDocumentCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.DocumentsDocument,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw documentsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.DocumentsDocumentCreate,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );

    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      return (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === unitId
      );
    });

    if (!hasAccess) {
      throw documentsAccessDenied();
    }
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    document: DocumentRow,
  ): Promise<void> {
    const context = toResourceContextFromDocument(document);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.DocumentsDocument, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw documentsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );

    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === document.unit_id
      ) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Document &&
        grant.resource_id !== null &&
        grant.resource_id === document.id
      ) {
        return true;
      }
      return false;
    });

    if (!hasAccess) {
      throw documentsAccessDenied();
    }
  }

  async assertListAction(actor: IdentityAuthzContext): Promise<void> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.DocumentsDocumentList,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );
    if (grants.length === 0) {
      throw documentsAccessDenied();
    }
  }

  async findListGrants(actor: IdentityAuthzContext) {
    await this.assertListAction(actor);
    return this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.DocumentsDocumentList,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );
  }
}
