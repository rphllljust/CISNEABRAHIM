import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { OperationalDashboardController } from './controllers/operational-dashboard.controller';
import { OperationalDashboardRepository } from './repositories/operational-dashboard.repository';
import { OperationalDashboardAccessService } from './services/operational-dashboard-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [OperationalDashboardController],
  providers: [OperationalDashboardRepository, OperationalDashboardAccessService],
  exports: [OperationalDashboardAccessService],
})
export class DashboardModule {}
