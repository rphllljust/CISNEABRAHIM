import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationDispatchJobHandler } from './handlers/notification-dispatch.handler';
import { OperationalAlertScanJobHandler } from './handlers/operational-alert-scan.handler';
import { BackgroundJobHandlerRegistry } from './services/background-job-handler.registry';
import { BackgroundWorkerService } from './services/background-worker.service';

@Injectable()
export class BackgroundWorkerBootstrapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackgroundWorkerBootstrapService.name);

  constructor(
    private readonly worker: BackgroundWorkerService,
    private readonly registry: BackgroundJobHandlerRegistry,
    private readonly notificationHandler: NotificationDispatchJobHandler,
    private readonly operationalAlertHandler: OperationalAlertScanJobHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.notificationHandler);
    this.registry.register(this.operationalAlertHandler);
    this.worker.start();
    this.logger.log('Background worker bootstrap complete');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.stop();
  }
}
