import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BACKGROUND_JOB_KINDS } from '../../platform/background-jobs/domain/background-job-kind';
import { BackgroundJobEnqueueService } from '../../platform/background-jobs/services/background-job-enqueue.service';

const SCAN_INTERVAL_MS = Number.parseInt(process.env['ALERT_SCAN_INTERVAL_MS'] ?? '60000', 10);

@Injectable()
export class OperationalAlertSchedulerBootstrap implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OperationalAlertSchedulerBootstrap.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly enqueueService: BackgroundJobEnqueueService) {}

  onModuleInit(): void {
    if (process.env['ALERT_SCAN_ENABLED'] !== 'true') {
      this.logger.log('Operational alert scan scheduler disabled (ALERT_SCAN_ENABLED != true)');
      return;
    }
    void this.enqueueScan('bootstrap');
    this.timer = setInterval(() => {
      void this.enqueueScan('interval');
    }, Number.isFinite(SCAN_INTERVAL_MS) ? SCAN_INTERVAL_MS : 60_000);
    this.logger.log('Operational alert scan scheduler started');
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async enqueueScan(reason: string): Promise<void> {
    const bucket = Math.floor(Date.now() / 60_000);
    await this.enqueueService.enqueue({
      jobKind: BACKGROUND_JOB_KINDS.OperationalAlertScan,
      idempotencyKey: `operational-alert-scan:${bucket}`,
      payload: { reason },
      priority: 5,
    });
  }
}
