import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AgingController } from './controllers/aging.controller';
import { OperationalProfitabilityController } from './controllers/operational-profitability.controller';
import { ProductivityController } from './controllers/productivity.controller';
import { AgingReadModelRepository } from './repositories/aging-read-model.repository';
import { OperationalProfitabilityReadModelRepository } from './repositories/operational-profitability-read-model.repository';
import { ProductivityReadModelRepository } from './repositories/productivity-read-model.repository';
import { AgingAccessService } from './services/aging-access.service';
import { OperationalProfitabilityAccessService } from './services/operational-profitability-access.service';
import { ProductivityAccessService } from './services/productivity-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [AgingController, ProductivityController, OperationalProfitabilityController],
  providers: [
    AgingReadModelRepository,
    AgingAccessService,
    ProductivityReadModelRepository,
    ProductivityAccessService,
    OperationalProfitabilityReadModelRepository,
    OperationalProfitabilityAccessService,
  ],
  exports: [
    AgingAccessService,
    ProductivityAccessService,
    ProductivityReadModelRepository,
    OperationalProfitabilityAccessService,
    OperationalProfitabilityReadModelRepository,
  ],
})
export class AnalyticsModule {}
