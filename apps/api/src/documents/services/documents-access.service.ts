import { HttpStatus, Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { toResourceContextFromDocument } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid } from '../../catalog/domain/service-catalog.validation';
import { CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import {
  DOCUMENT_CLASSIFICATIONS,
  DOCUMENT_CATEGORIES,
  isDocumentCategory,
  MAX_FILE_SIZE_BYTES,
  MAX_VERSIONS_PER_DOCUMENT,
} from '../domain/document-categories';
import { validateUploadedFile } from '../domain/file-validation';
import type { CreateDocumentUploadInput, ListDocumentsQuery, UploadedFileInput } from '../dto/documents.dto';
import { DOCUMENT_ERROR_CODES } from '../errors/document-error-codes';
import { DocumentHttpException } from '../errors/document-http.exception';
import type { DocumentRow } from '../repositories/documents.repository';
import { DocumentsRepository } from '../repositories/documents.repository';
import {
  assertNoStorageKeyLeak,
  toDocumentResponse,
  toDocumentVersionResponse,
  type DocumentResponse,
  type DocumentVersionResponse,
} from '../serializers/documents-response.serializer';
import { createPersistWithCompensation } from './document-upload-coordinator';
import { DownloadTokenService } from '../storage/download-token.service';
import { ObjectStorageService } from '../storage/object-storage.service';

@Injectable()
export class DocumentsAccessService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
    private readonly securityAudit: SecurityAuditService,
    private readonly objectStorage: ObjectStorageService,
    private readonly downloadTokens: DownloadTokenService,
  ) {}

  async createWithUpload(
    actor: IdentityAuthzContext,
    metadata: CreateDocumentUploadInput,
    file: UploadedFileInput,
  ): Promise<{ document: DocumentResponse; version: DocumentVersionResponse }> {
    await this.assertCreateAction(actor, metadata.unitId);
    await this.assertUnitRegistered(metadata.unitId);
    this.assertSingleFile(file);

    const validation = await validateUploadedFile({
      buffer: file.buffer,
      filename: file.filename,
      declaredMime: file.mimetype,
      category: metadata.categoryCode,
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
    });
    if (!validation.ok) {
      throw this.validationError(validation.reason);
    }

    try {
      const persisted = await createPersistWithCompensation(
        this.objectStorage,
        this.downloadTokens,
        this.documentsRepository,
        {
          title: metadata.title,
          categoryCode: metadata.categoryCode,
          classificationCode: metadata.classificationCode,
          unitId: metadata.unitId,
          actorIdentityId: actor.identityId,
          sha256: validation.sha256,
          mimeType: validation.mime,
          originalFilename: file.filename,
          buffer: file.buffer,
        },
      );

      const document = await this.documentsRepository.findDocumentById(persisted.documentId);
      const version = await this.documentsRepository.findVersion(
        persisted.documentId,
        persisted.versionNumber,
      );
      if (!document || !version) {
        throw this.notFound();
      }

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.DocumentsDocumentCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.DocumentsDocument,
        resourceId: document.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification:
          metadata.classificationCode === DOCUMENT_CLASSIFICATIONS.Restricted
            ? SECURITY_AUDIT_CLASSIFICATIONS.Critical
            : SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: {
          versionNumber: version.version_number,
          sha256: version.sha256_hash,
        },
      });

      const response = {
        document: toDocumentResponse(document),
        version: toDocumentVersionResponse(version, document.current_version_number),
      };
      assertNoStorageKeyLeak(response);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message === 'STORAGE_PUT_FAILED') {
        throw new DocumentHttpException(
          HttpStatus.SERVICE_UNAVAILABLE,
          DOCUMENT_ERROR_CODES.STORAGE_FAILURE,
          'Object storage upload failed.',
        );
      }
      throw error;
    }
  }

  async uploadVersion(
    actor: IdentityAuthzContext,
    documentId: string,
    file: UploadedFileInput,
  ): Promise<DocumentVersionResponse> {
    this.assertValidDocumentId(documentId);
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw this.notFound();
    }

    await this.assertRecordAction(actor, AUTHZ_ACTIONS.DocumentsDocumentUploadVersion, document);
    this.assertSingleFile(file);

    const versionCount = await this.documentsRepository.countVersions(documentId);
    if (versionCount >= MAX_VERSIONS_PER_DOCUMENT) {
      throw new DocumentHttpException(
        HttpStatus.CONFLICT,
        DOCUMENT_ERROR_CODES.MAX_VERSIONS_REACHED,
        'Maximum number of document versions reached.',
      );
    }

    const validation = await validateUploadedFile({
      buffer: file.buffer,
      filename: file.filename,
      declaredMime: file.mimetype,
      category: isDocumentCategory(document.category_code)
        ? document.category_code
        : DOCUMENT_CATEGORIES.General,
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
    });
    if (!validation.ok) {
      throw this.validationError(validation.reason);
    }

    const persisted = await createPersistWithCompensation(
      this.objectStorage,
      this.downloadTokens,
      this.documentsRepository,
      {
        documentId,
        categoryCode: document.category_code,
        classificationCode: document.classification_code,
        unitId: document.unit_id,
        actorIdentityId: actor.identityId,
        sha256: validation.sha256,
        mimeType: validation.mime,
        originalFilename: file.filename,
        buffer: file.buffer,
      },
    );

    const version = await this.documentsRepository.findVersion(
      persisted.documentId,
      persisted.versionNumber,
    );
    const refreshed = await this.documentsRepository.findDocumentById(documentId);
    if (!version || !refreshed) {
      throw this.notFound();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.DocumentsDocumentUploadVersion,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.DocumentsDocument,
      resourceId: documentId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber: version.version_number },
    });

    const response = toDocumentVersionResponse(version, refreshed.current_version_number);
    assertNoStorageKeyLeak(response);
    return response;
  }

  async getById(actor: IdentityAuthzContext, documentId: string): Promise<DocumentResponse> {
    this.assertValidDocumentId(documentId);
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, AUTHZ_ACTIONS.DocumentsDocumentRead, document);
    const response = toDocumentResponse(document);
    assertNoStorageKeyLeak(response);
    return response;
  }

  async list(
    actor: IdentityAuthzContext,
    query: ListDocumentsQuery,
  ): Promise<{ items: DocumentResponse[]; limit: number; offset: number }> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.DocumentsDocumentList,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );
    if (grants.length === 0) {
      throw this.denied();
    }

    const scopeFilter = this.scopeEnforcement.buildDocumentListFilter(grants);
    if (scopeFilter.clause === 'FALSE') {
      throw this.denied();
    }

    const clauses = [scopeFilter.clause === 'TRUE' ? 'TRUE' : scopeFilter.clause];
    const params = [...scopeFilter.params];

    if (query.unitId) {
      params.push(query.unitId);
      clauses.push(`unit_id = $${params.length}`);
    }
    if (query.categoryCode) {
      params.push(query.categoryCode);
      clauses.push(`category_code = $${params.length}`);
    }

    const items = await this.documentsRepository.listDocuments(
      clauses.join(' AND '),
      params,
      query.limit,
      query.offset,
    );

    const response = {
      items: items.map(toDocumentResponse),
      limit: query.limit,
      offset: query.offset,
    };
    assertNoStorageKeyLeak(response);
    return response;
  }

  async listVersions(
    actor: IdentityAuthzContext,
    documentId: string,
  ): Promise<DocumentVersionResponse[]> {
    this.assertValidDocumentId(documentId);
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, AUTHZ_ACTIONS.DocumentsDocumentRead, document);

    const versions = await this.documentsRepository.listVersions(documentId);
    const response = versions.map((version) =>
      toDocumentVersionResponse(version, document.current_version_number),
    );
    assertNoStorageKeyLeak(response);
    return response;
  }

  async getVersion(
    actor: IdentityAuthzContext,
    documentId: string,
    versionNumber: number,
  ): Promise<DocumentVersionResponse> {
    this.assertValidDocumentId(documentId);
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, AUTHZ_ACTIONS.DocumentsDocumentRead, document);

    const version = await this.documentsRepository.findVersion(documentId, versionNumber);
    if (!version) {
      throw new DocumentHttpException(
        HttpStatus.NOT_FOUND,
        DOCUMENT_ERROR_CODES.VERSION_NOT_FOUND,
        'Document version not found.',
      );
    }

    const response = toDocumentVersionResponse(version, document.current_version_number);
    assertNoStorageKeyLeak(response);
    return response;
  }

  async streamContent(
    actor: IdentityAuthzContext,
    documentId: string,
    versionNumber: number,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string; sha256: string }> {
    this.assertValidDocumentId(documentId);
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, AUTHZ_ACTIONS.DocumentsDocumentDownload, document);

    const version = await this.documentsRepository.findVersionWithStorage(documentId, versionNumber);
    if (!version) {
      throw new DocumentHttpException(
        HttpStatus.NOT_FOUND,
        DOCUMENT_ERROR_CODES.VERSION_NOT_FOUND,
        'Document version not found.',
      );
    }

    const stored = await this.objectStorage.getObject(version.storage_key);
    if (!stored) {
      throw new DocumentHttpException(
        HttpStatus.NOT_FOUND,
        DOCUMENT_ERROR_CODES.NOT_FOUND,
        'Stored object not found.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.DocumentsDocumentDownload,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.DocumentsDocument,
      resourceId: documentId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification:
        document.classification_code === DOCUMENT_CLASSIFICATIONS.Restricted
          ? SECURITY_AUDIT_CLASSIFICATIONS.Critical
          : SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber },
    });

    return {
      buffer: stored.buffer,
      mimeType: version.mime_type,
      filename: version.original_filename,
      sha256: version.sha256_hash,
    };
  }

  async issueDownloadUrl(
    actor: IdentityAuthzContext,
    documentId: string,
    versionNumber: number,
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    this.assertValidDocumentId(documentId);
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, AUTHZ_ACTIONS.DocumentsDocumentDownload, document);

    const version = await this.documentsRepository.findVersion(documentId, versionNumber);
    if (!version) {
      throw new DocumentHttpException(
        HttpStatus.NOT_FOUND,
        DOCUMENT_ERROR_CODES.VERSION_NOT_FOUND,
        'Document version not found.',
      );
    }

    const issued = this.downloadTokens.issue(documentId, versionNumber);
    return {
      downloadUrl: `/api/v1/documents/download?token=${encodeURIComponent(issued.token)}`,
      expiresAt: issued.expiresAt,
    };
  }

  async streamByToken(
    token: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const verified = this.downloadTokens.verify(token);
    if (verified === 'INVALID') {
      throw new DocumentHttpException(
        HttpStatus.FORBIDDEN,
        DOCUMENT_ERROR_CODES.DOWNLOAD_TOKEN_INVALID,
        'Download token is invalid.',
      );
    }
    if (verified === 'EXPIRED') {
      throw new DocumentHttpException(
        HttpStatus.FORBIDDEN,
        DOCUMENT_ERROR_CODES.DOWNLOAD_TOKEN_EXPIRED,
        'Download token has expired.',
      );
    }

    const version = await this.documentsRepository.findVersionWithStorage(
      verified.documentId,
      verified.versionNumber,
    );
    if (!version) {
      throw this.notFound();
    }

    const stored = await this.objectStorage.getObject(version.storage_key);
    if (!stored) {
      throw new DocumentHttpException(
        HttpStatus.NOT_FOUND,
        DOCUMENT_ERROR_CODES.NOT_FOUND,
        'Stored object not found.',
      );
    }

    return {
      buffer: stored.buffer,
      mimeType: version.mime_type,
      filename: version.original_filename,
    };
  }

  private assertSingleFile(file: UploadedFileInput | null | undefined): void {
    if (!file || !file.buffer || file.buffer.byteLength === 0) {
      throw new DocumentHttpException(
        HttpStatus.BAD_REQUEST,
        DOCUMENT_ERROR_CODES.INVALID_INPUT,
        'A single file upload is required.',
      );
    }
  }

  private async assertUnitRegistered(unitId: string): Promise<void> {
    const registered = await this.documentsRepository.isUnitRegistered(unitId);
    if (!registered) {
      throw new DocumentHttpException(
        HttpStatus.BAD_REQUEST,
        DOCUMENT_ERROR_CODES.UNIT_NOT_REGISTERED,
        'Unit is not registered.',
      );
    }
  }

  private async assertCreateAction(actor: IdentityAuthzContext, unitId: string): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.DocumentsDocumentCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.DocumentsDocument,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.DocumentsDocumentCreate,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );

    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      return (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === unitId
      );
    });

    if (!hasAccess) {
      throw this.denied();
    }
  }

  private async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    document: DocumentRow,
  ): Promise<void> {
    const context = toResourceContextFromDocument(document);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.DocumentsDocument, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.DocumentsDocument,
    );

    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === document.unit_id
      ) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Document &&
        grant.resource_id !== null &&
        grant.resource_id === document.id
      ) {
        return true;
      }
      return false;
    });

    if (!hasAccess) {
      throw this.denied();
    }
  }

  private assertValidDocumentId(documentId: string): void {
    try {
      assertUuid(documentId);
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private validationError(
    reason: 'INVALID_MIME' | 'INVALID_EXTENSION' | 'MAGIC_BYTES_MISMATCH' | 'FILE_TOO_LARGE',
  ): DocumentHttpException {
    switch (reason) {
      case 'INVALID_MIME':
        return new DocumentHttpException(
          HttpStatus.BAD_REQUEST,
          DOCUMENT_ERROR_CODES.INVALID_MIME,
          'MIME type is not allowed.',
        );
      case 'INVALID_EXTENSION':
        return new DocumentHttpException(
          HttpStatus.BAD_REQUEST,
          DOCUMENT_ERROR_CODES.INVALID_EXTENSION,
          'File extension does not match MIME type.',
        );
      case 'MAGIC_BYTES_MISMATCH':
        return new DocumentHttpException(
          HttpStatus.BAD_REQUEST,
          DOCUMENT_ERROR_CODES.MAGIC_BYTES_MISMATCH,
          'File content does not match declared MIME type.',
        );
      case 'FILE_TOO_LARGE':
        return new DocumentHttpException(
          HttpStatus.PAYLOAD_TOO_LARGE,
          DOCUMENT_ERROR_CODES.FILE_TOO_LARGE,
          'File exceeds maximum allowed size.',
        );
      default:
        return new DocumentHttpException(
          HttpStatus.BAD_REQUEST,
          DOCUMENT_ERROR_CODES.INVALID_INPUT,
          'Invalid upload.',
        );
    }
  }

  private denied(): DocumentHttpException {
    return new DocumentHttpException(
      HttpStatus.FORBIDDEN,
      DOCUMENT_ERROR_CODES.DENIED,
      'Document access denied.',
    );
  }

  private notFound(): DocumentHttpException {
    return new DocumentHttpException(
      HttpStatus.NOT_FOUND,
      DOCUMENT_ERROR_CODES.NOT_FOUND,
      'Document not found.',
    );
  }
}
