import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import { loadVitestEnv } from './src/test/load-vitest-env';

loadVitestEnv();

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: [
      'src/**/*.integration.spec.ts',
      'src/**/*.e2e.spec.ts',
      'src/**/*.perf.spec.ts',
      'src/**/*.perf-smoke.spec.ts',
      'src/**/*.perf-stress.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
