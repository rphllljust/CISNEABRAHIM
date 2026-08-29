import { Controller, Get, HttpCode, Ip, Post, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
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
    return this.authService.login(input, clientKey);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: FastifyRequest) {
    const body: unknown = request.body;
    const input = parseRefreshInput(body);
    return this.authService.refresh(input);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentAuth() auth: AccessTokenClaims) {
    return this.authService.logout(auth.sid);
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentAuth() auth: AccessTokenClaims) {
    return this.authService.logoutAll(auth.sub);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async currentSession(@CurrentAuth() auth: AccessTokenClaims) {
    return this.authService.currentSession(auth.sub, auth.sid);
  }
}
