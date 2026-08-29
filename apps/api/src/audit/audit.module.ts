import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { SecurityAuditRepository } from './repositories/security-audit.repository';
import { AuditBootstrapService } from './services/audit-bootstrap.service';
import { SecurityAuditService } from './services/security-audit.service';

@Module({
  imports: [DatabaseModule],
  providers: [SecurityAuditRepository, SecurityAuditService, AuditBootstrapService],
  exports: [SecurityAuditService, SecurityAuditRepository],
})
export class AuditModule {}
