import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyAuthTestEnv } from '../../auth/test/auth-test-env';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { BackgroundJobsModule } from './background-jobs.module';
import { OperationalAlertSchedulerBootstrap } from './services/operational-alert-scheduler.bootstrap';
import { BackgroundJobEnqueueService } from './services/background-job-enqueue.service';

describe('BackgroundJobsModule wiring', () => {
  let module: TestingModule;

  beforeAll(async () => {
    applyAuthTestEnv('postgresql://cisne_local_dev:password@127.0.0.1:5432/cisne_local_test');
    module = await Test.createTestingModule({
      imports: [DatabaseModule, BackgroundJobsModule],
    }).compile();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('resolves OperationalAlertSchedulerBootstrap with BackgroundJobEnqueueService', () => {
    const bootstrap = module.get(OperationalAlertSchedulerBootstrap);
    const enqueue = module.get(BackgroundJobEnqueueService);
    expect(bootstrap).toBeDefined();
    expect(enqueue).toBeDefined();
  });
});
