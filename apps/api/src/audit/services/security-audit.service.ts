import { Injectable, Logger } from '@nestjs/common';
import { SECURITY_AUDIT_CLASSIFICATIONS } from '../types/security-audit.types';
import type { RecordSecurityAuditInput } from '../types/security-audit.types';
import {
  SecurityAuditPersistenceError,
  SecurityAuditRepository,
} from '../repositories/security-audit.repository';

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly repository: SecurityAuditRepository) {}

  async record(input: RecordSecurityAuditInput): Promise<string | null> {
    try {
      return await this.repository.insert(input);
    } catch (error) {
      this.handlePersistenceFailure(input, error);
      return null;
    }
  }

  async recordCritical(input: RecordSecurityAuditInput): Promise<string> {
    const id = await this.record(input);
    if (!id) {
      throw new SecurityAuditPersistenceError();
    }
    return id;
  }

  private handlePersistenceFailure(input: RecordSecurityAuditInput, error: unknown): void {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (input.classification === SECURITY_AUDIT_CLASSIFICATIONS.Critical) {
      this.logger.error(`SECURITY_AUDIT persistence failed for ${input.action}: ${message}`);
      return;
    }
    this.logger.warn(`SECURITY_AUDIT persistence failed for ${input.action}: ${message}`);
  }
}
