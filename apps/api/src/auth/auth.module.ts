import { Module } from '@nestjs/common';
import { loadAuthConfig } from './config/auth.config';
import { AUTH_CONFIG } from './auth.constants';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthController } from './auth.controller';
import { IdentityAuthRepository } from './repositories/identity-auth.repository';
import { AuthService } from './services/auth.service';
import { LoginRateLimiterService } from './services/login-rate-limiter.service';
import { SessionValidationService } from './services/session-validation.service';
import { TokenService } from './services/token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: () => loadAuthConfig(),
    },
    TokenService,
    LoginRateLimiterService,
    IdentityAuthRepository,
    SessionValidationService,
    AuthService,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard, AUTH_CONFIG],
})
export class AuthModule {}
