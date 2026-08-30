import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import { loadVitestEnv } from './src/test/load-vitest-env';

loadVitestEnv();

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.perf.spec.ts', 'src/**/*.perf-smoke.spec.ts', 'src/**/*.perf-stress.spec.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 300_000,
    hookTimeout: 120_000,
    globalSetup: ['./src/test/ensure-migrations.ts'],
  },
});
