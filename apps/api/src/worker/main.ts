import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { collectRuntimeConfigErrors } from '../platform/runtime-config/runtime-config';
import { WorkerAppModule } from './worker-app.module';

// dist/worker/main.js and src/worker/main.ts are both four levels under the
// env root (repo or release package), so the .env sits four dirs up.
config({ path: resolve(__dirname, '../../../../.env') });

async function bootstrap(): Promise<void> {
  const configErrors = collectRuntimeConfigErrors('worker', process.env);
  if (configErrors.length > 0) {
    console.error(`CONFIGURATION_ERROR\n${configErrors.join('\n')}`);
    process.exit(1);
  }

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
