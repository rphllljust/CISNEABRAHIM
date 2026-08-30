import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import { loadVitestEnv } from './src/test/load-vitest-env';

loadVitestEnv();

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.spec.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 120_000,
    testTimeout: 300_000,
    globalSetup: ['./src/test/ensure-migrations.ts'],
  },
});
