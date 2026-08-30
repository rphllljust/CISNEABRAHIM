import { Module } from '@nestjs/common';
import { IntegrationsInboxModule } from '../integrations/inbox/integrations-inbox.module';
import { IntegrationInboxProcessorWorkerService } from '../integrations/inbox/services/integration-inbox-processor.worker.service';
import { BackgroundJobsModule } from '../platform/background-jobs/background-jobs.module';
import { BackgroundWorkerBootstrapService } from '../platform/background-jobs/background-worker.bootstrap';
import { OutboxModule } from '../platform/outbox/outbox.module';
import { OutboxPublisherWorkerService } from '../platform/outbox/services/outbox-publisher.worker.service';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule, BackgroundJobsModule, OutboxModule, IntegrationsInboxModule],
  providers: [BackgroundWorkerBootstrapService, OutboxPublisherWorkerService, IntegrationInboxProcessorWorkerService],
})
export class WorkerAppModule {}
