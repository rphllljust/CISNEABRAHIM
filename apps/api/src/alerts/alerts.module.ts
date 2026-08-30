import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { BusinessAlertsController } from './controllers/business-alerts.controller';
import { AlertCandidateRepository } from './repositories/alert-candidate.repository';
import { BusinessAlertsRepository } from './repositories/business-alerts.repository';
import { BusinessAlertAccessService } from './services/business-alert-access.service';
import { BusinessAlertScanService } from './services/business-alert-scan.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [BusinessAlertsController],
  providers: [
    AlertCandidateRepository,
    BusinessAlertsRepository,
    BusinessAlertScanService,
    BusinessAlertAccessService,
  ],
  exports: [BusinessAlertScanService, BusinessAlertAccessService],
})
export class AlertsModule {}
