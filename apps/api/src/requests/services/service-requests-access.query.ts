import { Injectable } from '@nestjs/common';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { isServiceRequestStatus } from '../domain/service-request';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';
import {
  toServiceRequestDetailResponse,
  toServiceRequestResponse,
  type ServiceRequestDetailResponse,
} from '../serializers/service-requests-response.serializer';
import { ServiceRequestsAccessAuthz } from './service-requests-access.authz';
import { serviceRequestsAccessNotFound, serviceRequestsValidationFailed } from './service-requests-access.errors';
import { assertValidServiceRequestId } from './service-requests-input-resolution';
import { ServiceRequestsAccessPersistence } from './service-requests-access.persistence';

@Injectable()
export class ServiceRequestsAccessQuery {
  constructor(
    private readonly persistence: ServiceRequestsAccessPersistence,
    private readonly authz: ServiceRequestsAccessAuthz,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async toDetail(row: ServiceRequestRow): Promise<ServiceRequestDetailResponse> {
    const links = await this.persistence.listDocumentLinks(row.id);
    return toServiceRequestDetailResponse(row, links);
  }

  async requireRecord(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    action: AuthzAction,
  ): Promise<ServiceRequestRow> {
    const row = await this.persistence.findById(serviceRequestId);
    if (!row) {
      throw serviceRequestsAccessNotFound();
    }
    await this.authz.assertRecordAction(actor, action, row);
    return row;
  }

  async getById(actor: IdentityAuthzContext, serviceRequestId: string): Promise<ServiceRequestDetailResponse> {
    assertValidServiceRequestId(serviceRequestId);
    const row = await this.requireRecord(actor, serviceRequestId, AUTHZ_ACTIONS.RequestsServiceRequestRead);
    return this.toDetail(row);
  }

  async list(
    actor: IdentityAuthzContext,
    query: { clientId?: string; unitId?: string; status?: string; limit: number; offset: number },
  ): Promise<{ items: ReturnType<typeof toServiceRequestResponse>[]; limit: number; offset: number }> {
    const grants = await this.authz.findListGrants(actor);
    const scopeFilter = this.scopeEnforcement.buildServiceRequestListFilter(grants);

    const clauses = [scopeFilter.clause];
    const params = [...scopeFilter.params];
    if (query.clientId) {
      params.push(query.clientId);
      clauses.push(`client_id = $${params.length}::uuid`);
    }
    if (query.unitId) {
      params.push(query.unitId);
      clauses.push(`unit_id = $${params.length}`);
    }
    if (query.status) {
      if (!isServiceRequestStatus(query.status)) {
        throw serviceRequestsValidationFailed();
      }
      params.push(query.status);
      clauses.push(`status = $${params.length}::sr.service_request_status`);
    }

    const rows = await this.persistence.listServiceRequests(
      clauses.join(' AND '),
      params,
      query.limit,
      query.offset,
    );

    return {
      items: rows.map(toServiceRequestResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }
}