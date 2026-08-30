import { Module } from '@nestjs/common';
import { BackgroundJobsModule } from '../platform/background-jobs/background-jobs.module';
import { BackgroundWorkerBootstrapService } from '../platform/background-jobs/background-worker.bootstrap';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule, BackgroundJobsModule],
  providers: [BackgroundWorkerBootstrapService],
})
export class WorkerAppModule {}
