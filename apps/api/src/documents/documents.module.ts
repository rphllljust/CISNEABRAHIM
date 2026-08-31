import { Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { SecurityModule } from '../security/security.module';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsRepository } from './repositories/documents.repository';
import { DocumentUploadCoordinator } from './services/document-upload-coordinator';
import { DocumentsAccessAuthz } from './services/documents-access.authz';
import { DocumentsAccessService } from './services/documents-access.service';
import { DownloadTokenService } from './storage/download-token.service';
import { ObjectStorageService } from './storage/object-storage.service';
import { DOCUMENT_UPLOAD_LIMITS } from './dto/documents.dto';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule, SecurityModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsRepository,
    DocumentsAccessAuthz,
    DocumentsAccessService,
    DocumentUploadCoordinator,
    ObjectStorageService,
    DownloadTokenService,
  ],
  exports: [DocumentsRepository, DocumentsAccessService, ObjectStorageService, DownloadTokenService],
})
export class DocumentsModule implements OnModuleInit {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  async onModuleInit(): Promise<void> {
    const fastify = this.adapterHost.httpAdapter.getInstance<FastifyInstance>();
    if (!fastify.hasDecorator('multipart')) {
      await fastify.register(multipart, {
        limits: {
          fileSize: DOCUMENT_UPLOAD_LIMITS.maxFileSizeBytes,
          files: DOCUMENT_UPLOAD_LIMITS.maxFilesPerRequest,
        },
      });
    }
  }
}
