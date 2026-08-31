import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';

@Injectable()
export class ServiceRequestsAccessAudit {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  async recordCreate(actor: IdentityAuthzContext, created: ServiceRequestRow): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestCreate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.RequestsServiceRequest,
      resourceId: created.id,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { requestCode: created.request_code, originSource: created.origin_source },
    });
  }

  async recordConvert(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    serviceOrderId: string,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestConvert,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.RequestsServiceRequest,
      resourceId: serviceRequestId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { serviceOrderId },
    });
  }

  async recordTransition(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    transition: string,
  ): Promise<void> {
    const actionMap: Record<string, (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS]> = {
      submit: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestSubmit,
      startReview: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestReview,
      approve: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestApprove,
      reject: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestReject,
      cancel: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestCancel,
    };
    const auditAction = actionMap[transition];
    if (!auditAction) {
      return;
    }
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: auditAction,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.RequestsServiceRequest,
      resourceId: serviceRequestId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { transition },
    });
  }
}