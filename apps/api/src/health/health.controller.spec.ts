import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../infrastructure/database/database.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns technical health payload with database status', async () => {
    const databaseService = {
      getHealth: vi.fn().mockResolvedValue({ status: 'up', latencyMs: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DatabaseService, useValue: databaseService }],
    }).compile();

    const controller = module.get(HealthController);
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.database).toEqual({ status: 'up', latencyMs: 2 });
    expect(() => new Date(result.timestamp)).not.toThrow();
  });

  it('returns degraded when database is down', async () => {
    const databaseService = {
      getHealth: vi.fn().mockResolvedValue({
        status: 'down',
        latencyMs: 5,
        error: 'connection refused',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DatabaseService, useValue: databaseService }],
    }).compile();

    const controller = module.get(HealthController);
    const result = await controller.getHealth();

    expect(result.status).toBe('degraded');
    expect(result.database.status).toBe('down');
  });
});
