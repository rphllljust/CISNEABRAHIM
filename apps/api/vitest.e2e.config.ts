import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

config({ path: resolve(__dirname, '../../.env') });

process.env['JWT_SECRET'] ??= 'test-jwt-secret-with-at-least-32-characters!!';

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.e2e.spec.ts'],
  },
});
