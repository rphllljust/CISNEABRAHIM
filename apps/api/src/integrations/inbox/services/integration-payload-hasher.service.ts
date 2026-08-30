import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationPayloadHasherService {
  hashPayload(payload: Record<string, unknown>): string {
    const canonical = stableStringify(payload);
    return createHash('sha256').update(canonical).digest('hex');
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}
