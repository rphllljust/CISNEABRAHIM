import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { SecurityModule } from '../security/security.module';
import { SearchController } from './controllers/search.controller';
import { SearchRepository } from './repositories/search.repository';
import { SearchAccessService } from './services/search-access.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, SecurityModule],
  controllers: [SearchController],
  providers: [SearchRepository, SearchAccessService],
  exports: [SearchAccessService],
})
export class SearchModule {}
