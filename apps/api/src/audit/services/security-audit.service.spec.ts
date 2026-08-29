import { describe, expect, it, vi } from 'vitest';
import { SecurityAuditService } from './security-audit.service';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../types/security-audit.types';
import { SecurityAuditPersistenceError, SecurityAuditRepository } from '../repositories/security-audit.repository';

describe('SecurityAuditService', () => {
  const baseInput = {
    action: SECURITY_AUDIT_ACTIONS.AuthLogin,
    resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Identity,
    outcome: SECURITY_AUDIT_OUTCOMES.Success,
    classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
  };

  it('returns null when persistence fails for standard events', async () => {
    const repository = {
      insert: vi.fn().mockRejectedValue(new SecurityAuditPersistenceError('db_down')),
    } as unknown as SecurityAuditRepository;
    const service = new SecurityAuditService(repository);

    await expect(service.record(baseInput)).resolves.toBeNull();
  });

  it('throws when persistence fails for critical events via recordCritical', async () => {
    const repository = {
      insert: vi.fn().mockRejectedValue(new SecurityAuditPersistenceError('db_down')),
    } as unknown as SecurityAuditRepository;
    const service = new SecurityAuditService(repository);

    await expect(
      service.recordCritical({
        ...baseInput,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      }),
    ).rejects.toBeInstanceOf(SecurityAuditPersistenceError);
  });
});
