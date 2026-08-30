import { Injectable, Logger } from '@nestjs/common';
import type { BackgroundJobHandler, JobHandlerContext } from '../../platform/background-jobs/domain/job-handler.types';
import { BACKGROUND_JOB_KINDS } from '../../platform/background-jobs/domain/background-job-kind';
import { ReportGenerationService } from '../services/report-generation.service';

@Injectable()
export class ReportGenerationJobHandler implements BackgroundJobHandler {
  readonly jobKind = BACKGROUND_JOB_KINDS.ReportGeneration;
  private readonly logger = new Logger(ReportGenerationJobHandler.name);

  constructor(private readonly generation: ReportGenerationService) {}

  async handle(context: JobHandlerContext): Promise<void> {
    const exportId = context.payload['exportId'];
    const identityId = context.payload['identityId'];
    const sessionId = context.payload['sessionId'];
    if (typeof exportId !== 'string' || typeof identityId !== 'string' || typeof sessionId !== 'string') {
      throw new Error('REPORT_GENERATION_INVALID_PAYLOAD');
    }

    await this.generation.generateExport(
      exportId,
      { identityId, sessionId },
      context.signal,
    );
    this.logger.log(`Report generation job completed exportId=${exportId}`);
  }
}
