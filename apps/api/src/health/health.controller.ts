import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database/database.service';

export type DatabaseHealthPayload =
  | { status: 'up'; latencyMs: number }
  | { status: 'down'; latencyMs: number; error?: string }
  | { status: 'not_configured' };

export type LivenessResponse = {
  status: 'ok';
  service: 'api';
  timestamp: string;
};

export type ReadinessResponse = {
  status: 'ready' | 'not_ready';
  service: 'api';
  timestamp: string;
  checks: {
    database: DatabaseHealthPayload;
  };
};

/** @deprecated Use /health/live and /health/ready for probe semantics. */
export type HealthResponse = {
  status: 'ok' | 'degraded';
  service: 'api';
  timestamp: string;
  database: DatabaseHealthPayload;
};

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('live')
  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReadiness(): Promise<ReadinessResponse> {
    const database = await this.databaseService.getHealth();
    const ready = database.status === 'up' || database.status === 'not_configured';
    return {
      status: ready ? 'ready' : 'not_ready',
      service: 'api',
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }

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
