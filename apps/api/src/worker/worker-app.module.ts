import { Module } from '@nestjs/common';
import { BackgroundJobsModule } from '../platform/background-jobs/background-jobs.module';
import { BackgroundWorkerBootstrapService } from '../platform/background-jobs/background-worker.bootstrap';
import { OutboxModule } from '../platform/outbox/outbox.module';
import { OutboxPublisherWorkerService } from '../platform/outbox/services/outbox-publisher.worker.service';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule, BackgroundJobsModule, OutboxModule],
  providers: [BackgroundWorkerBootstrapService, OutboxPublisherWorkerService],
})
export class WorkerAppModule {}
