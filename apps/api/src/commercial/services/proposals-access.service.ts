import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { toResourceContextFromProposal } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import {
  PROPOSAL_PRICING_STRUCTURES,
  PROPOSAL_VERSION_STATUSES,
} from '../domain/proposal';
import {
  ProposalValidationError,
  validateAcceptProposalInput,
  validateCancelProposalInput,
  validateCreateProposalInput,
  validateLinkProposalDocumentInput,
  validateRejectProposalInput,
  validateUpdateProposalDraftInput,
  type AcceptProposalInput,
  type CancelProposalInput,
  type CreateProposalInput,
  type LinkProposalDocumentInput,
  type RejectProposalInput,
  type UpdateProposalDraftInput,
} from '../domain/proposal.validation';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';
import { ProposalsRepository } from '../repositories/proposals.repository';
import type { ProposalRow } from '../repositories/proposals.repository.types';
import {
  buildProposalDetail,
  toProposalResponse,
  toProposalVersionResponse,
  type ProposalDetailResponse,
  type ProposalResponse,
  type ProposalVersionResponse,
} from '../serializers/proposals-response.serializer';

@Injectable()
export class ProposalsAccessService {
  constructor(
    private readonly proposalsRepository: ProposalsRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateProposalInput,
  ): Promise<ProposalDetailResponse> {
    let validated;
    try {
      validated = validateCreateProposalInput(input);
    } catch (error) {
      if (error instanceof ProposalValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    await this.assertCreateAction(actor, input.clientId, input.unitId);
    await this.assertClientActive(input.clientId);
    await this.assertUnitRegistered(input.unitId);
    await this.assertServiceReferences(validated.items);

    const created = await this.proposalsRepository.createProposal({
      proposalCode: this.generateProposalCode(),
      clientId: input.clientId,
      unitId: input.unitId,
      title: input.title.trim(),
      pricingStructure: validated.pricingStructure,
      currencyCode: validated.currencyCode,
      globalSalePrice: validated.globalSalePrice,
      globalInternalCost: validated.globalInternalCost,
      commercialTerms: input.commercialTerms ?? {},
      validUntil: input.validUntil ?? null,
      notes: input.notes ?? null,
      items: validated.items,
      actorIdentityId: actor.identityId,
    });

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalCreate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: created.proposal.id,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { proposalCode: created.proposal.proposal_code },
    });

    return buildProposalDetail(created.proposal, created.version, created.items, []);
  }

  async updateDraft(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    input: UpdateProposalDraftInput,
  ): Promise<ProposalDetailResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalUpdate);

    let validated;
    try {
      validated = validateUpdateProposalDraftInput(input);
    } catch (error) {
      if (error instanceof ProposalValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }
    if (validated.items) {
      await this.assertServiceReferences(validated.items);
    }

    const updated = await this.proposalsRepository.updateDraft({
      proposalId,
      versionNumber,
      ...validated,
      actorIdentityId: actor.identityId,
    });

    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
    }

    const documents = await this.proposalsRepository.listDocumentLinks(updated.version.id);
    return buildProposalDetail(updated.proposal, updated.version, updated.items, documents);
  }

  async createRevision(
    actor: IdentityAuthzContext,
    proposalId: string,
  ): Promise<ProposalDetailResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalUpdate);

    const result = await this.proposalsRepository.createRevision(proposalId, actor.identityId);
    if (result === 'DRAFT_EXISTS') {
      throw new CommercialHttpException(
        HttpStatus.CONFLICT,
        COMMERCIAL_ERROR_CODES.DRAFT_EXISTS,
        'A draft version already exists.',
      );
    }
    if (result === 'REVISION_NOT_ALLOWED') {
      throw new CommercialHttpException(
        HttpStatus.CONFLICT,
        COMMERCIAL_ERROR_CODES.REVISION_NOT_ALLOWED,
        'Revision is not allowed for the current version.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalCreateVersion,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: proposalId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber: result.version.version_number },
    });

    return buildProposalDetail(result.proposal, result.version, result.items, []);
  }

  async issue(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    rowVersion: number,
  ): Promise<ProposalVersionResponse> {
    this.assertValidProposalId(proposalId);
    const proposal = await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalIssue);
    const version = await this.requireVersion(proposalId, versionNumber);
    if (version.status !== PROPOSAL_VERSION_STATUSES.Draft || version.row_version !== rowVersion) {
      throw version.status !== PROPOSAL_VERSION_STATUSES.Draft
        ? this.invalidState()
        : this.versionConflict();
    }

    await this.assertIssueReady(version);

    const client = await this.proposalsRepository.findClientById(proposal.client_id);
    if (!client) {
      throw this.clientNotFound();
    }

    const items = await this.proposalsRepository.listItems(version.id);
    const itemSnapshots = await Promise.all(
      items.map(async (item) => {
        if (!item.service_definition_id) {
          return { itemId: item.id, serviceSnapshot: null };
        }
        const snapshot = await this.proposalsRepository.findServiceSnapshot(
          item.service_definition_id,
          item.service_definition_version_id ?? undefined,
        );
        return {
          itemId: item.id,
          serviceSnapshot: snapshot
            ? {
                serviceDefinitionId: snapshot.service_definition_id,
                serviceDefinitionVersionId: snapshot.service_definition_version_id,
                code: snapshot.code,
                name: snapshot.name,
                version: snapshot.version,
                versionStatus: snapshot.version_status,
              }
            : null,
        };
      }),
    );

    const issued = await this.proposalsRepository.issueVersion(
      proposalId,
      versionNumber,
      rowVersion,
      actor.identityId,
      {
        clientId: client.id,
        legalName: client.legal_name,
        tradeName: client.trade_name,
        normalizedTaxId: client.normalized_tax_id,
        status: client.status,
      },
      itemSnapshots,
    );

    if (issued === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (issued === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalIssue,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: proposalId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber },
    });

    const documents = await this.proposalsRepository.listDocumentLinks(issued.id);
    const issuedItems = await this.proposalsRepository.listItems(issued.id);
    return toProposalVersionResponse(issued, issuedItems, documents);
  }

  async accept(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    input: AcceptProposalInput,
  ): Promise<ProposalVersionResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalAccept);

    let validated;
    try {
      validated = validateAcceptProposalInput(input);
    } catch (error) {
      if (error instanceof ProposalValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    if (validated.acceptanceEvidenceDocumentId) {
      const document = await this.proposalsRepository.findDocumentById(
        validated.acceptanceEvidenceDocumentId,
      );
      if (!document) {
        throw this.documentNotFound();
      }
    }

    const accepted = await this.proposalsRepository.transitionVersion(
      proposalId,
      versionNumber,
      validated.rowVersion,
      PROPOSAL_VERSION_STATUSES.Accepted,
      actor.identityId,
      {
        acceptedAt: new Date().toISOString(),
        acceptedByIdentityId: actor.identityId,
        acceptanceOriginCode: validated.acceptanceOriginCode,
        acceptanceEvidenceDocumentId: validated.acceptanceEvidenceDocumentId ?? null,
      },
    );

    if (accepted === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (accepted === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalAccept,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: proposalId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      metadata: {
        versionNumber,
        acceptanceOriginCode: validated.acceptanceOriginCode,
      },
    });

    const documents = await this.proposalsRepository.listDocumentLinks(accepted.id);
    const items = await this.proposalsRepository.listItems(accepted.id);
    return toProposalVersionResponse(accepted, items, documents);
  }

  async reject(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    input: RejectProposalInput,
  ): Promise<ProposalVersionResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalReject);

    let validated;
    try {
      validated = validateRejectProposalInput(input);
    } catch (error) {
      if (error instanceof ProposalValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const rejected = await this.proposalsRepository.transitionVersion(
      proposalId,
      versionNumber,
      validated.rowVersion,
      PROPOSAL_VERSION_STATUSES.Rejected,
      actor.identityId,
      {
        rejectedAt: new Date().toISOString(),
        rejectedByIdentityId: actor.identityId,
        rejectionReason: validated.rejectionReason ?? null,
      },
    );

    if (rejected === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (rejected === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalReject,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: proposalId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber },
    });

    const documents = await this.proposalsRepository.listDocumentLinks(rejected.id);
    const items = await this.proposalsRepository.listItems(rejected.id);
    return toProposalVersionResponse(rejected, items, documents);
  }

  async expire(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    rowVersion: number,
  ): Promise<ProposalVersionResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalExpire);

    const expired = await this.proposalsRepository.transitionVersion(
      proposalId,
      versionNumber,
      rowVersion,
      PROPOSAL_VERSION_STATUSES.Expired,
      actor.identityId,
      { expiredAt: new Date().toISOString() },
    );

    if (expired === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (expired === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalExpire,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: proposalId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber },
    });

    const documents = await this.proposalsRepository.listDocumentLinks(expired.id);
    const items = await this.proposalsRepository.listItems(expired.id);
    return toProposalVersionResponse(expired, items, documents);
  }

  async cancel(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    input: CancelProposalInput,
  ): Promise<ProposalVersionResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalCancel);

    let validated;
    try {
      validated = validateCancelProposalInput(input);
    } catch (error) {
      if (error instanceof ProposalValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const cancelled = await this.proposalsRepository.cancelVersion(
      proposalId,
      versionNumber,
      validated.rowVersion,
      actor.identityId,
      validated.cancellationReason ?? null,
    );

    if (cancelled === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (cancelled === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialProposalCancel,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialProposal,
      resourceId: proposalId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { versionNumber },
    });

    const documents = await this.proposalsRepository.listDocumentLinks(cancelled.id);
    const items = await this.proposalsRepository.listItems(cancelled.id);
    return toProposalVersionResponse(cancelled, items, documents);
  }

  async linkDocument(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
    input: LinkProposalDocumentInput,
  ): Promise<ProposalDetailResponse> {
    this.assertValidProposalId(proposalId);
    const proposal = await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalUpdate);
    const version = await this.requireVersion(proposalId, versionNumber);

    let validated;
    try {
      validated = validateLinkProposalDocumentInput(input);
    } catch (error) {
      if (error instanceof ProposalValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const document = await this.proposalsRepository.findDocumentById(validated.documentId);
    if (!document) {
      throw this.documentNotFound();
    }
    if (document.unit_id !== proposal.unit_id) {
      throw this.denied();
    }

    await this.proposalsRepository.linkDocument(
      version.id,
      validated.documentId,
      validated.linkPurpose,
      actor.identityId,
    );

    const items = await this.proposalsRepository.listItems(version.id);
    const documents = await this.proposalsRepository.listDocumentLinks(version.id);
    return buildProposalDetail(proposal, version, items, documents);
  }

  async getById(actor: IdentityAuthzContext, proposalId: string): Promise<ProposalDetailResponse> {
    this.assertValidProposalId(proposalId);
    const proposal = await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalRead);
    const versionNumber = proposal.current_version_number;
    if (!versionNumber) {
      return buildProposalDetail(proposal, null, [], []);
    }
    const version = await this.requireVersion(proposalId, versionNumber);
    const items = await this.proposalsRepository.listItems(version.id);
    const documents = await this.proposalsRepository.listDocumentLinks(version.id);
    return buildProposalDetail(proposal, version, items, documents);
  }

  async getVersion(
    actor: IdentityAuthzContext,
    proposalId: string,
    versionNumber: number,
  ): Promise<ProposalVersionResponse> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalRead);
    const version = await this.requireVersion(proposalId, versionNumber);
    const items = await this.proposalsRepository.listItems(version.id);
    const documents = await this.proposalsRepository.listDocumentLinks(version.id);
    return toProposalVersionResponse(version, items, documents);
  }

  async listVersions(
    actor: IdentityAuthzContext,
    proposalId: string,
  ): Promise<ProposalVersionResponse[]> {
    this.assertValidProposalId(proposalId);
    await this.requireProposal(actor, proposalId, AUTHZ_ACTIONS.CommercialProposalRead);
    const versions = await this.proposalsRepository.listVersions(proposalId);
    const responses: ProposalVersionResponse[] = [];
    for (const version of versions) {
      const items = await this.proposalsRepository.listItems(version.id);
      const documents = await this.proposalsRepository.listDocumentLinks(version.id);
      responses.push(toProposalVersionResponse(version, items, documents));
    }
    return responses;
  }

  async list(
    actor: IdentityAuthzContext,
    query: { clientId?: string; unitId?: string; limit: number; offset: number },
  ): Promise<{ items: ProposalResponse[]; limit: number; offset: number }> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialProposalList,
      AUTHZ_RESOURCE_TYPES.CommercialProposal,
    );
    if (grants.length === 0) {
      throw this.denied();
    }

    const scopeFilter = this.scopeEnforcement.buildProposalListFilter(grants);
    if (scopeFilter.clause === 'FALSE') {
      throw this.denied();
    }

    const clauses = [scopeFilter.clause === 'TRUE' ? 'TRUE' : scopeFilter.clause];
    const params = [...scopeFilter.params];
    if (query.clientId) {
      params.push(query.clientId);
      clauses.push(`client_id = $${params.length}::uuid`);
    }
    if (query.unitId) {
      params.push(query.unitId);
      clauses.push(`unit_id = $${params.length}`);
    }

    const items = await this.proposalsRepository.listProposals(
      clauses.join(' AND '),
      params,
      query.limit,
      query.offset,
    );
    return {
      items: items.map(toProposalResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  private async assertIssueReady(version: {
    id: string;
    pricing_structure: string;
    global_sale_price_amount: string | null;
  }): Promise<void> {
    if (
      version.pricing_structure === PROPOSAL_PRICING_STRUCTURES.GlobalPrice &&
      !version.global_sale_price_amount
    ) {
      throw this.validationFailed();
    }
    if (version.pricing_structure === PROPOSAL_PRICING_STRUCTURES.Itemized) {
      const items = await this.proposalsRepository.listItems(version.id);
      if (items.length === 0 || items.some((item) => !item.line_sale_amount)) {
        throw this.validationFailed();
      }
    }
  }

  private async assertServiceReferences(
    items: Array<{ serviceDefinitionId?: string; serviceDefinitionVersionId?: string }>,
  ): Promise<void> {
    for (const item of items) {
      if (!item.serviceDefinitionId) {
        continue;
      }
      const snapshot = await this.proposalsRepository.findServiceSnapshot(
        item.serviceDefinitionId,
        item.serviceDefinitionVersionId,
      );
      if (!snapshot) {
        throw this.serviceNotFound();
      }
    }
  }

  private async assertClientActive(clientId: string): Promise<void> {
    const client = await this.proposalsRepository.findClientById(clientId);
    if (!client) {
      throw this.clientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw new CommercialHttpException(
        HttpStatus.CONFLICT,
        COMMERCIAL_ERROR_CODES.CLIENT_INACTIVE,
        'Client is inactive.',
      );
    }
  }

  private async assertUnitRegistered(unitId: string): Promise<void> {
    const registered = await this.proposalsRepository.isUnitRegistered(unitId);
    if (!registered) {
      throw new CommercialHttpException(
        HttpStatus.BAD_REQUEST,
        COMMERCIAL_ERROR_CODES.UNIT_NOT_REGISTERED,
        'Unit is not registered.',
      );
    }
  }

  private async requireProposal(
    actor: IdentityAuthzContext,
    proposalId: string,
    action: AuthzAction,
  ): Promise<ProposalRow> {
    const proposal = await this.proposalsRepository.findProposalById(proposalId);
    if (!proposal) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, action, proposal);
    return proposal;
  }

  private async requireVersion(proposalId: string, versionNumber: number) {
    const version = await this.proposalsRepository.findVersion(proposalId, versionNumber);
    if (!version) {
      throw new CommercialHttpException(
        HttpStatus.NOT_FOUND,
        COMMERCIAL_ERROR_CODES.VERSION_NOT_FOUND,
        'Proposal version not found.',
      );
    }
    return version;
  }

  private async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string,
    unitId: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialProposalCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialProposalCreate,
      AUTHZ_RESOURCE_TYPES.CommercialProposal,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === unitId
      ) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Client &&
        grant.resource_id !== null &&
        grant.resource_id === clientId
      ) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }
  }

  private async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    proposal: ProposalRow,
  ): Promise<void> {
    const context = toResourceContextFromProposal(proposal);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CommercialProposal,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === proposal.unit_id
      ) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Client &&
        grant.resource_id !== null &&
        grant.resource_id === proposal.client_id
      ) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }
  }

  private assertValidProposalId(proposalId: string): void {
    try {
      assertUuid(proposalId);
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private generateProposalCode(): string {
    return `PROP-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private validationFailed(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.BAD_REQUEST,
      COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  private denied(): CommercialHttpException {
    return new CommercialHttpException(HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.');
  }

  private notFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.NOT_FOUND,
      COMMERCIAL_ERROR_CODES.NOT_FOUND,
      'Proposal not found.',
    );
  }

  private versionConflict(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.CONFLICT,
      COMMERCIAL_ERROR_CODES.VERSION_CONFLICT,
      'Proposal version conflict.',
    );
  }

  private invalidState(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.CONFLICT,
      COMMERCIAL_ERROR_CODES.INVALID_STATE,
      'Proposal is not in a valid state for this operation.',
    );
  }

  private clientNotFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.BAD_REQUEST,
      COMMERCIAL_ERROR_CODES.CLIENT_NOT_FOUND,
      'Client not found.',
    );
  }

  private serviceNotFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.BAD_REQUEST,
      COMMERCIAL_ERROR_CODES.SERVICE_NOT_FOUND,
      'Service definition not found.',
    );
  }

  private documentNotFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.BAD_REQUEST,
      COMMERCIAL_ERROR_CODES.DOCUMENT_NOT_FOUND,
      'Document not found.',
    );
  }
}
