import { Injectable, OnModuleInit } from '@nestjs/common';
import { TestIntegrationInboxHandler } from '../handlers/test-integration-inbox.handler';
import { IntegrationInboxHandlerRegistry } from './integration-inbox-handler.registry';

@Injectable()
export class IntegrationInboxBootstrapService implements OnModuleInit {
  constructor(
    private readonly handlerRegistry: IntegrationInboxHandlerRegistry,
    private readonly testHandler: TestIntegrationInboxHandler,
  ) {}

  onModuleInit(): void {
    this.handlerRegistry.register(this.testHandler);
  }
}
