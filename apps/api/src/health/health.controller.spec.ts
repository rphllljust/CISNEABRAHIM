import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns technical health payload', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = module.get(HealthController);
    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(() => new Date(result.timestamp)).not.toThrow();
  });
});
