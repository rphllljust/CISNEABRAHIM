import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ExecutiveDashboardController } from './controllers/executive-dashboard.controller';
import { OperationalDashboardController } from './controllers/operational-dashboard.controller';
import { ExecutiveDashboardRepository } from './repositories/executive-dashboard.repository';
import { OperationalDashboardRepository } from './repositories/operational-dashboard.repository';
import { ExecutiveDashboardAccessService } from './services/executive-dashboard-access.service';
import { OperationalDashboardAccessService } from './services/operational-dashboard-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AnalyticsModule],
  controllers: [OperationalDashboardController, ExecutiveDashboardController],
  providers: [
    OperationalDashboardRepository,
    ExecutiveDashboardRepository,
    OperationalDashboardAccessService,
    ExecutiveDashboardAccessService,
  ],
  exports: [OperationalDashboardAccessService, ExecutiveDashboardAccessService],
})
export class DashboardModule {}
