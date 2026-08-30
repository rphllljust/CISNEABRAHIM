import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TestIntegrationInboxHandler } from './handlers/test-integration-inbox.handler';
import { IntegrationInboxRepository } from './repositories/integration-inbox.repository';
import { IntegrationInboxBootstrapService } from './services/integration-inbox-bootstrap.service';
import { IntegrationInboxHandlerRegistry } from './services/integration-inbox-handler.registry';
import { IntegrationInboxProcessorService } from './services/integration-inbox-processor.service';
import { IntegrationInboxProcessorWorkerService } from './services/integration-inbox-processor.worker.service';
import { IntegrationInboxReceiveService } from './services/integration-inbox-receive.service';
import { IntegrationPayloadHasherService } from './services/integration-payload-hasher.service';
import { IntegrationWebhookAuthService } from './services/integration-webhook-auth.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    IntegrationInboxRepository,
    IntegrationPayloadHasherService,
    IntegrationWebhookAuthService,
    IntegrationInboxReceiveService,
    IntegrationInboxHandlerRegistry,
    IntegrationInboxBootstrapService,
    IntegrationInboxProcessorService,
    IntegrationInboxProcessorWorkerService,
    TestIntegrationInboxHandler,
  ],
  exports: [
    IntegrationInboxRepository,
    IntegrationInboxReceiveService,
    IntegrationInboxProcessorService,
    IntegrationInboxProcessorWorkerService,
    IntegrationInboxHandlerRegistry,
  ],
})
export class IntegrationsInboxModule {}
