import { Module } from '@nestjs/common';
import { EventsModule } from '../../events/events.module';
import { BackgroundJobsModule } from '../background-jobs/background-jobs.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxDomainEventWriter } from './services/outbox-domain-event.writer';
import { OutboxPublisherService } from './services/outbox-publisher.service';
import { OutboxPublisherWorkerService } from './services/outbox-publisher.worker.service';

@Module({
  imports: [DatabaseModule, EventsModule, BackgroundJobsModule],
  providers: [
    OutboxRepository,
    OutboxDomainEventWriter,
    OutboxPublisherService,
    OutboxPublisherWorkerService,
  ],
  exports: [OutboxRepository, OutboxDomainEventWriter, OutboxPublisherService, OutboxPublisherWorkerService],
})
export class OutboxModule {}
