import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { NotificationDispatchJobHandler } from './handlers/notification-dispatch.handler';
import { BackgroundJobsRepository } from './repositories/background-jobs.repository';
import { BackgroundJobEnqueueService } from './services/background-job-enqueue.service';
import { BackgroundJobHandlerRegistry } from './services/background-job-handler.registry';
import { BackgroundWorkerService } from './services/background-worker.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [
    BackgroundJobsRepository,
    BackgroundJobEnqueueService,
    BackgroundJobHandlerRegistry,
    BackgroundWorkerService,
    NotificationDispatchJobHandler,
  ],
  exports: [
    BackgroundJobsRepository,
    BackgroundJobEnqueueService,
    BackgroundJobHandlerRegistry,
    BackgroundWorkerService,
  ],
})
export class BackgroundJobsModule {}
