#!/usr/bin/env node
import { runHmlDeploySmoke } from '../hml-smoke';

async function main(): Promise<void> {
  const baseUrl = process.env['HML_PUBLIC_API_URL'] ?? `http://127.0.0.1:${process.env['PORT'] ?? '3100'}`;
  const login = process.env['HML_SMOKE_LOGIN'] ?? process.env['BOOTSTRAP_ADMIN_LOGIN'];
  const password = process.env['HML_SMOKE_PASSWORD'] ?? process.env['BOOTSTRAP_ADMIN_PASSWORD'];

  if (!login || !password) {
    console.error('HML_SMOKE_LOGIN and HML_SMOKE_PASSWORD are required');
    process.exit(1);
  }

  const result = await runHmlDeploySmoke({ baseUrl, login, password });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[hml-smoke] fatal', error);
  process.exitCode = 1;
});
