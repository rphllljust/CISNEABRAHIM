export function getNodeEnv(env: NodeJS.ProcessEnv = process.env): string {
  return env['NODE_ENV'] ?? 'development';
}

export function assertDevelopmentOnly(operation: string, env: NodeJS.ProcessEnv = process.env): void {
  const nodeEnv = getNodeEnv(env);
  if (nodeEnv !== 'development') {
    throw new Error(`${operation} is only permitted when NODE_ENV=development (got ${nodeEnv}).`);
  }
}

export function assertProductionBootstrapAllowed(operation: string): void {
  const nodeEnv = getNodeEnv();
  if (nodeEnv === 'production' && process.env['BOOTSTRAP_CONFIRM'] !== 'I_UNDERSTAND') {
    throw new Error(
      `${operation} in production requires BOOTSTRAP_CONFIRM=I_UNDERSTAND and explicit CLI invocation.`,
    );
  }
}

export function assertNotProductionSeed(operation: string): void {
  const nodeEnv = getNodeEnv();
  if (nodeEnv === 'production') {
    throw new Error(`${operation} must not run in production. Use PRODUCTION_BOOTSTRAP manually.`);
  }
}
