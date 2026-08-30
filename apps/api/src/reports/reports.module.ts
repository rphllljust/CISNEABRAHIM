import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DocumentsModule } from '../documents/documents.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { BackgroundJobsModule } from '../platform/background-jobs/background-jobs.module';
import { ReportExportController } from './controllers/report-export.controller';
import { ReportGenerationJobHandler } from './handlers/report-generation.handler';
import { ReportsWorkerBootstrap } from './reports-worker.bootstrap';
import { ReportExportRepository } from './repositories/report-export.repository';
import { ReportDataService } from './services/report-data.service';
import { ReportExportAccessService } from './services/report-export-access.service';
import { ReportGenerationService } from './services/report-generation.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    AnalyticsModule,
    AuditModule,
    DocumentsModule,
    BackgroundJobsModule,
  ],
  controllers: [ReportExportController],
  providers: [
    ReportExportRepository,
    ReportDataService,
    ReportGenerationService,
    ReportExportAccessService,
    ReportGenerationJobHandler,
    ReportsWorkerBootstrap,
  ],
  exports: [ReportGenerationService, ReportExportAccessService],
})
export class ReportsModule {}
