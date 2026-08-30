import { Injectable } from '@nestjs/common';
import type { IntegrationInboxHandler } from '../domain/inbox-handler.types';

@Injectable()
export class IntegrationInboxHandlerRegistry {
  private readonly handlers: IntegrationInboxHandler[] = [];

  register(handler: IntegrationInboxHandler): void {
    this.handlers.push(handler);
  }

  get(eventType: string): IntegrationInboxHandler | null {
    return this.handlers.find((handler) => handler.supports(eventType)) ?? null;
  }
}
