import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule, AuthModule, AuthorizationModule],
})
export class AppModule {}
