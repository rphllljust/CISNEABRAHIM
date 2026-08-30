import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InboxAuthFailureError } from '../domain/inbox-errors';

@Injectable()
export class IntegrationWebhookAuthService {
  validateSignature(input: {
    provider: string;
    rawBody: string;
    signature: string | null | undefined;
  }): void {
    const secret = this.resolveSecret(input.provider);
    if (!secret) {
      return;
    }
    if (!input.signature) {
      throw new InboxAuthFailureError(`MISSING_WEBHOOK_SIGNATURE_FOR_${input.provider}`);
    }
    const expected = createHmac('sha256', secret).update(input.rawBody).digest('hex');
    const provided = input.signature.startsWith('sha256=')
      ? input.signature.slice('sha256='.length)
      : input.signature;
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const providedBuffer = Buffer.from(provided, 'utf8');
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new InboxAuthFailureError(`INVALID_WEBHOOK_SIGNATURE_FOR_${input.provider}`);
    }
  }

  private resolveSecret(provider: string): string | null {
    const normalized = provider.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const direct = process.env[`INTEGRATION_WEBHOOK_SECRET_${normalized}`];
    if (direct && direct.trim().length > 0) {
      return direct;
    }
    const json = process.env['INTEGRATION_WEBHOOK_SECRETS'];
    if (!json) {
      return null;
    }
    try {
      const parsed = JSON.parse(json) as Record<string, string>;
      const value = parsed[provider] ?? parsed[normalized];
      return typeof value === 'string' && value.trim().length > 0 ? value : null;
    } catch {
      return null;
    }
  }
}
