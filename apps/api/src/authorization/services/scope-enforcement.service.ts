import { Injectable } from '@nestjs/common';
import type { GrantRow } from '../repositories/authorization.repository';
import { ScopeResolverService } from './scope-resolver.service';
import { AUTHZ_SCOPES } from '../types/authz-scopes';

const UUID_V4ISH = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ScopeSqlPredicate = {
  clause: string;
  params: unknown[];
};

@Injectable()
export class ScopeEnforcementService {
  constructor(private readonly scopeResolver: ScopeResolverService) {}

  assertValidClientResourceId(resourceId: string): void {
    if (!UUID_V4ISH.test(resourceId)) {
      throw new Error('INVALID_RESOURCE_ID');
    }
  }

  /**
   * Constrói filtro SQL obrigatório para listagem — nega por omissão (sem grant → 1=0).
   */
  buildScopedRecordListFilter(grants: GrantRow[], identityId: string): ScopeSqlPredicate {
    const clauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const grant of grants) {
      switch (grant.scope_type) {
        case AUTHZ_SCOPES.Global:
          if (grant.resource_id === null) {
            return { clause: 'TRUE', params: [] };
          }
          break;
        case AUTHZ_SCOPES.Own:
          clauses.push(`owner_identity_id = $${paramIndex++}`);
          params.push(identityId);
          break;
        case AUTHZ_SCOPES.Assigned:
          clauses.push(`assigned_identity_id = $${paramIndex++}`);
          params.push(identityId);
          if (grant.resource_id) {
            clauses.push(`id::text = $${paramIndex++}`);
            params.push(grant.resource_id);
          }
          break;
        case AUTHZ_SCOPES.Unit:
          clauses.push(`unit_id = $${paramIndex++}`);
          params.push(grant.resource_id);
          break;
        case AUTHZ_SCOPES.Client:
          clauses.push(`client_id = $${paramIndex++}`);
          params.push(grant.resource_id);
          break;
        case AUTHZ_SCOPES.Contract:
          clauses.push(`contract_id = $${paramIndex++}`);
          params.push(grant.resource_id);
          break;
        case AUTHZ_SCOPES.Document:
          clauses.push(`document_id = $${paramIndex++}`);
          params.push(grant.resource_id);
          break;
        case AUTHZ_SCOPES.Financial:
          clauses.push(`is_financial = TRUE AND contract_id = $${paramIndex++}`);
          params.push(grant.resource_id);
          break;
        default:
          break;
      }
    }

    if (clauses.length === 0) {
      return { clause: 'FALSE', params: [] };
    }

    return {
      clause: `(${clauses.join(' OR ')})`,
      params,
    };
  }

  buildClientListFilter(grants: GrantRow[]): ScopeSqlPredicate {
    const clauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const grant of grants) {
      switch (grant.scope_type) {
        case AUTHZ_SCOPES.Global:
          if (grant.resource_id === null) {
            return { clause: 'TRUE', params: [] };
          }
          break;
        case AUTHZ_SCOPES.Client:
          clauses.push(`id::text = $${paramIndex++}`);
          params.push(grant.resource_id);
          break;
        default:
          break;
      }
    }

    if (clauses.length === 0) {
      return { clause: 'FALSE', params: [] };
    }

    return {
      clause: `(${clauses.join(' OR ')})`,
      params,
    };
  }

  canAccessRecord(
    grants: GrantRow[],
    identityId: string,
    context: Parameters<ScopeResolverService['hasEffectiveAccess']>[2],
  ): boolean {
    return this.scopeResolver.hasEffectiveAccess(grants, identityId, context);
  }
}
