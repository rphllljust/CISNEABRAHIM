import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ReportGenerationJobHandler } from './handlers/report-generation.handler';
import { BackgroundJobHandlerRegistry } from '../platform/background-jobs/services/background-job-handler.registry';

@Injectable()
export class ReportsWorkerBootstrap implements OnModuleInit {
  private readonly logger = new Logger(ReportsWorkerBootstrap.name);

  constructor(
    private readonly registry: BackgroundJobHandlerRegistry,
    private readonly reportGenerationHandler: ReportGenerationJobHandler,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.reportGenerationHandler);
    this.logger.log('Report generation handler registered');
  }
}
