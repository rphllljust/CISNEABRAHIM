const SENSITIVE_PATTERNS: RegExp[] = [
  /password\s*[:=]/i,
  /refresh_token/i,
  /access_token/i,
  /bearer\s+[a-z0-9._~+/=-]{10,}/i,
  /jwt_secret/i,
  /postgresql:\/\//i,
  /\bselect\b.+\bfrom\b/i,
  /\binsert\b.+\binto\b/i,
  /ENOENT|EPERM|EACCES/i,
  /[A-Za-z]:\\[^\s]+/,
  /\/(?:home|var|usr|etc|opt)\/[^\s]+/,
  /at\s+[^\s]+\s+\([^)]+:\d+:\d+\)/,
  /node_modules[\\/]/,
];

export function containsSensitiveErrorLeak(value: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizePublicErrorMessage(
  error: unknown,
  options?: { isProduction?: boolean },
): { code: string; message: string } {
  const isProduction = options?.isProduction ?? process.env['NODE_ENV'] === 'production';
  if (!isProduction && error instanceof Error) {
    if (!containsSensitiveErrorLeak(error.message)) {
      return { code: 'INTERNAL_ERROR', message: error.message };
    }
  }

  if (error instanceof Error && !isProduction) {
    return { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' };
  }

  return { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' };
}

export function sanitizeHttpExceptionMessage(message: string, status: number): string {
  if (status >= 500) {
    return 'Internal server error.';
  }
  if (containsSensitiveErrorLeak(message)) {
    return 'Request failed.';
  }
  return message;
}
