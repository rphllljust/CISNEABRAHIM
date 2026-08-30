import { Controller, Get, HttpCode, Ip, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { resolveCorrelationId } from '../infrastructure/http/correlation-id';
import { CurrentAuth } from './decorators/current-auth.decorator';
import { parseLoginInput } from './dto/login.dto';
import { parseRefreshInput } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import type { AccessTokenClaims } from './services/token.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Req() request: FastifyRequest, @Ip() ip: string) {
    const body: unknown = request.body;
    const input = parseLoginInput(body);
    const clientKey = `${ip}:${request.headers['user-agent'] ?? 'unknown'}`;
    return this.authService.login(input, {
      clientKey,
      correlationId: resolveCorrelationId(request),
      clientIp: ip,
    });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: FastifyRequest, @Ip() ip: string) {
    const body: unknown = request.body;
    const input = parseRefreshInput(body);
    return this.authService.refresh(input, {
      clientKey: `${ip}:${request.headers['user-agent'] ?? 'unknown'}`,
      correlationId: resolveCorrelationId(request),
      clientIp: ip,
    });
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    return this.authService.logout(auth.sid, auth.sub, {
      correlationId: resolveCorrelationId(request),
    });
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentAuth() auth: AccessTokenClaims, @Req() request: FastifyRequest) {
    return this.authService.logoutAll(auth.sub, auth.sid, {
      correlationId: resolveCorrelationId(request),
    });
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async currentSession(@CurrentAuth() auth: AccessTokenClaims) {
    return this.authService.currentSession(auth.sub, auth.sid);
  }
}
