import { Injectable, Logger } from '@nestjs/common';
import type { BackgroundJobHandler, JobHandlerContext } from '../domain/job-handler.types';
import { BACKGROUND_JOB_KINDS } from '../domain/background-job-kind';
import { BusinessAlertScanService } from '../../../alerts/services/business-alert-scan.service';

@Injectable()
export class OperationalAlertScanJobHandler implements BackgroundJobHandler {
  readonly jobKind = BACKGROUND_JOB_KINDS.OperationalAlertScan;
  private readonly logger = new Logger(OperationalAlertScanJobHandler.name);

  constructor(private readonly scanService: BusinessAlertScanService) {}

  async handle(_context: JobHandlerContext): Promise<void> {
    const result = await this.scanService.runScan();
    this.logger.log(
      `Operational alert scan job finished created=${result.created} touched=${result.touched} resolved=${result.resolved}`,
    );
  }
}
