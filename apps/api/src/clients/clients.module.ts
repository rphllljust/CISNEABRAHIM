import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { ClientsController } from './controllers/clients.controller';
import { ClientsRepository } from './repositories/clients.repository';
import { ClientAccessService } from './services/client-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [ClientsController],
  providers: [ClientsRepository, ClientAccessService],
  exports: [ClientAccessService],
})
export class ClientsModule {}
