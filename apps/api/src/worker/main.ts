import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { WorkerAppModule } from './worker-app.module';

config({ path: resolve(__dirname, '../../../.env') });

async function bootstrap(): Promise<void> {
  process.env['WORKER_ENABLED'] ??= 'true';

  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Worker received ${signal}, shutting down gracefully`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void bootstrap();
