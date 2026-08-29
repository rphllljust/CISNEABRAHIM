import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../types/security-audit.types';
import { SecurityAuditService } from './security-audit.service';

@Injectable()
export class AuditBootstrapService implements OnModuleInit {
  constructor(private readonly securityAudit: SecurityAuditService) {}

  onModuleInit(): void {
    void this.securityAudit.record({
      action: SECURITY_AUDIT_ACTIONS.AppBootstrap,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Application,
      resourceId: 'api',
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { channel: 'SECURITY_AUDIT' },
    });
  }
}
