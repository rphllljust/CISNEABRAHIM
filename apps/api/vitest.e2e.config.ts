import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import { loadVitestEnv } from './src/test/load-vitest-env';

loadVitestEnv();

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.e2e.spec.ts'],
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 180_000,
    testTimeout: 300_000,
    globalSetup: ['./src/test/ensure-migrations.ts'],
    setupFiles: ['./src/test/integration-test-db-serializer.ts'],
  },
});
