import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AgingController } from './controllers/aging.controller';
import { ProductivityController } from './controllers/productivity.controller';
import { AgingReadModelRepository } from './repositories/aging-read-model.repository';
import { ProductivityReadModelRepository } from './repositories/productivity-read-model.repository';
import { AgingAccessService } from './services/aging-access.service';
import { ProductivityAccessService } from './services/productivity-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [AgingController, ProductivityController],
  providers: [
    AgingReadModelRepository,
    AgingAccessService,
    ProductivityReadModelRepository,
    ProductivityAccessService,
  ],
  exports: [AgingAccessService, ProductivityAccessService, ProductivityReadModelRepository],
})
export class AnalyticsModule {}
