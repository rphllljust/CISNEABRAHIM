import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AgingController } from './controllers/aging.controller';
import { AgingReadModelRepository } from './repositories/aging-read-model.repository';
import { AgingAccessService } from './services/aging-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [AgingController],
  providers: [AgingReadModelRepository, AgingAccessService],
  exports: [AgingAccessService],
})
export class AnalyticsModule {}
