import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database/database.service';

export type DatabaseHealthPayload =
  | { status: 'up'; latencyMs: number }
  | { status: 'down'; latencyMs: number; error?: string }
  | { status: 'not_configured' };

export type HealthResponse = {
  status: 'ok' | 'degraded';
  service: 'api';
  timestamp: string;
  database: DatabaseHealthPayload;
};

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    const database = await this.databaseService.getHealth();
    const isDatabaseHealthy = database.status === 'up' || database.status === 'not_configured';

    return {
      status: isDatabaseHealthy ? 'ok' : 'degraded',
      service: 'api',
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
