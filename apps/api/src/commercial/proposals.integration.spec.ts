import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertCatalogCategory,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateCatalogTables,
  truncateClientTables,
  truncateCommercialProposalTables,
  truncateDocumentTables,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { SECURITY_AUDIT_ACTIONS } from '../audit/types/security-audit.types';
import { CatalogModule } from '../catalog/catalog.module';
import { ClientsModule } from '../clients/clients.module';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { ClientAccessService } from '../clients/services/client-access.service';
import { DocumentsModule } from '../documents/documents.module';
import { DOCUMENT_CATEGORIES } from '../documents/domain/document-categories';
import { minimalPdfBuffer } from '../documents/domain/file-validation';
import { DocumentsAccessService } from '../documents/services/documents-access.service';
import { ServiceCatalogAccessService } from '../catalog/services/service-catalog-access.service';
import { CommercialModule } from './commercial.module';
import { COMMERCIAL_ERROR_CODES } from './errors/commercial-error-codes';
import {
  PROPOSAL_ACCEPTANCE_ORIGINS,
  PROPOSAL_DOCUMENT_LINK_PURPOSES,
  PROPOSAL_ITEM_KINDS,
  PROPOSAL_PRICING_STRUCTURES,
  PROPOSAL_VERSION_STATUSES,
} from './domain/proposal';
import { ProposalsAccessService } from './services/proposals-access.service';

const UNIT_A = 'unit-proposal-a';
const UNIT_B = 'unit-proposal-b';
const TEST_CNPJ = '11222333000181';

async function grantProposalAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.CommercialProposalCreate,
    AUTHZ_ACTIONS.CommercialProposalRead,
    AUTHZ_ACTIONS.CommercialProposalList,
    AUTHZ_ACTIONS.CommercialProposalUpdate,
    AUTHZ_ACTIONS.CommercialProposalIssue,
    AUTHZ_ACTIONS.CommercialProposalAccept,
    AUTHZ_ACTIONS.CommercialProposalReject,
    AUTHZ_ACTIONS.CommercialProposalExpire,
    AUTHZ_ACTIONS.CommercialProposalCancel,
    AUTHZ_ACTIONS.ClientCreate,
    AUTHZ_ACTIONS.ClientRead,
    AUTHZ_ACTIONS.CatalogServiceCreate,
    AUTHZ_ACTIONS.CatalogServiceRead,
    AUTHZ_ACTIONS.CatalogServicePublish,
    AUTHZ_ACTIONS.DocumentsDocumentCreate,
    AUTHZ_ACTIONS.DocumentsDocumentRead,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: action.startsWith('client:')
        ? AUTHZ_RESOURCE_TYPES.Client
        : action.startsWith('catalog:')
          ? AUTHZ_RESOURCE_TYPES.CatalogService
          : action.startsWith('documents:')
            ? AUTHZ_RESOURCE_TYPES.DocumentsDocument
            : AUTHZ_RESOURCE_TYPES.CommercialProposal,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Commercial proposals PostgreSQL integration', () => {
  let pool: Pool;
  let proposalsAccess: ProposalsAccessService;
  let clientAccess: ClientAccessService;
  let catalogAccess: ServiceCatalogAccessService;
  let documentsAccess: DocumentsAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for commercial proposals integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);
    process.env['OBJECT_STORAGE_ROOT'] ??= '.object-storage-test';
    process.env['OBJECT_STORAGE_PROVIDER'] ??= 'filesystem';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        AuditModule,
        AuthorizationModule,
        ClientsModule,
        CatalogModule,
        DocumentsModule,
        CommercialModule,
      ],
    }).compile();

    proposalsAccess = module.get(ProposalsAccessService);
    clientAccess = module.get(ClientAccessService);
    catalogAccess = module.get(ServiceCatalogAccessService);
    documentsAccess = module.get(DocumentsAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCommercialProposalTables(pool);
    await truncateDocumentTables(pool);
    await truncateClientTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_B });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string; actor: { identityId: string; sessionId: string } }> {
    const login = normalizeLoginIdentifier(`proposal-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantProposalAdmin(pool, identityId, identityId);
    return { identityId, actor: { identityId, sessionId: 'sid' } };
  }

  async function seedClient(actor: { identityId: string; sessionId: string }) {
    return clientAccess.create(actor, {
      legalName: `Cliente Teste ${crypto.randomUUID()}`,
      tradeName: 'Cliente Teste',
      taxId: TEST_CNPJ,
      contacts: [
        {
          name: 'Contato operacional',
          purpose: CONTACT_PURPOSES.Operational,
          phone: '69999990000',
        },
      ],
    });
  }

  async function seedPublishedService(actor: { identityId: string; sessionId: string }) {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const category = await insertCatalogCategory(pool, {
      code: `CAT-${suffix}`,
      name: 'Serviços de infraestrutura',
    });
    const draft = await catalogAccess.create(actor, {
      code: `SRV-${suffix}`,
      name: 'Regularização de estrada',
      categoryId: category.categoryId,
      archetype: 'CIVIL_WORK',
      measurementMode: 'BY_EVENT',
      measurementBasis: 'GLOBAL_COMPLETION',
      allowedUnits: [{ unitCode: 'SERVICE', isDefault: true, sortOrder: 0 }],
      pricingModels: [
        { modelCode: 'GLOBAL_PRICE', salePrice: '96000.0000', internalCost: '70000.0000' },
      ],
      resourceRequirements: [],
      laborRequirements: [],
      executionRequirements: [],
    });
    const definition = await catalogAccess.getDefinition(actor, draft.serviceDefinitionId);
    return catalogAccess.publishVersion(actor, draft.serviceDefinitionId, 1, definition.version);
  }

  it('supports global-price road regularization scenario without decomposing global total', async () => {
    const { actor } = await seedActor();
    const client = await seedClient(actor);
    const publishedService = await seedPublishedService(actor);

    const created = await proposalsAccess.create(actor, {
      clientId: client.id,
      unitId: UNIT_A,
      title: 'Regularização de estrada — trecho KM 12',
      pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
      globalSalePrice: '96000.0000',
      globalInternalCost: '70000.0000',
      items: [
        {
          lineNumber: 1,
          itemKind: PROPOSAL_ITEM_KINDS.Material,
          description: 'Material — 280 m³',
          quantity: '280.0000',
          unitCode: 'M3',
          serviceDefinitionId: publishedService.serviceDefinitionId,
          serviceDefinitionVersionId: publishedService.id,
        },
        {
          lineNumber: 2,
          itemKind: PROPOSAL_ITEM_KINDS.Labor,
          description: 'Mão de obra especializada',
        },
        {
          lineNumber: 3,
          itemKind: PROPOSAL_ITEM_KINDS.Equipment,
          description: 'Equipamentos de terraplanagem',
        },
        {
          lineNumber: 4,
          itemKind: PROPOSAL_ITEM_KINDS.Transport,
          description: 'Transporte de insumos',
        },
      ],
    });

    expect(created.currentVersion?.pricingStructure).toBe('GLOBAL_PRICE');
    expect(created.currentVersion?.globalSalePrice).toBe('96000');

    const issued = await proposalsAccess.issue(
      actor,
      created.proposal.id,
      1,
      created.currentVersion!.rowVersion,
    );
    expect(issued.status).toBe(PROPOSAL_VERSION_STATUSES.Issued);
    expect(issued.clientSnapshot?.['legalName']).toBe(client.legalName);
    expect(issued.items[0]?.serviceSnapshot?.['code']).toBe(publishedService.code);

    const evidenceDoc = await documentsAccess.createWithUpload(
      actor,
      {
        title: 'Aceite assinado',
        categoryCode: DOCUMENT_CATEGORIES.General,
        classificationCode: 'INTERNAL',
        unitId: UNIT_A,
      },
      { buffer: minimalPdfBuffer(), filename: 'aceite.pdf', mimetype: 'application/pdf' },
    );

    const accepted = await proposalsAccess.accept(actor, created.proposal.id, 1, {
      rowVersion: issued.rowVersion,
      acceptanceOriginCode: PROPOSAL_ACCEPTANCE_ORIGINS.ClientWrittenConfirmation,
      acceptanceEvidenceDocumentId: evidenceDoc.document.id,
    });
    expect(accepted.status).toBe(PROPOSAL_VERSION_STATUSES.Accepted);
    expect(accepted.acceptanceOriginCode).toBe(PROPOSAL_ACCEPTANCE_ORIGINS.ClientWrittenConfirmation);
    expect(accepted.acceptanceEvidenceDocumentId).toBe(evidenceDoc.document.id);
  });

  it('issues itemized proposal and preserves version history on revision', async () => {
    const { actor } = await seedActor();
    const client = await seedClient(actor);

    const created = await proposalsAccess.create(actor, {
      clientId: client.id,
      unitId: UNIT_A,
      title: 'Itemized services',
      pricingStructure: PROPOSAL_PRICING_STRUCTURES.Itemized,
      items: [
        {
          lineNumber: 1,
          itemKind: PROPOSAL_ITEM_KINDS.Service,
          description: 'Serviço A',
          lineSaleAmount: '1000.5000',
          lineInternalCost: '800.2500',
        },
        {
          lineNumber: 2,
          itemKind: PROPOSAL_ITEM_KINDS.Service,
          description: 'Serviço B',
          lineSaleAmount: '250.2500',
        },
      ],
    });

    const issued = await proposalsAccess.issue(
      actor,
      created.proposal.id,
      1,
      created.currentVersion!.rowVersion,
    );
    expect(issued.status).toBe(PROPOSAL_VERSION_STATUSES.Issued);

    const revision = await proposalsAccess.createRevision(actor, created.proposal.id);
    expect(revision.currentVersion?.versionNumber).toBe(2);
    expect(revision.currentVersion?.status).toBe(PROPOSAL_VERSION_STATUSES.Draft);

    const versions = await proposalsAccess.listVersions(actor, created.proposal.id);
    expect(versions).toHaveLength(2);
    expect(versions.find((v) => v.versionNumber === 1)?.status).toBe(PROPOSAL_VERSION_STATUSES.Issued);
  });

  it('rejects stale row version updates and unauthorized access', async () => {
    const owner = await seedActor();
    const intruderLogin = normalizeLoginIdentifier(`proposal-intruder-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: intruderId } = await insertIdentity(pool, intruderLogin, passwordHash);
    await insertGrant(pool, {
      identityId: intruderId,
      action: AUTHZ_ACTIONS.CommercialProposalRead,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_B,
      grantedByIdentityId: intruderId,
    });

    const client = await seedClient(owner.actor);
    const created = await proposalsAccess.create(owner.actor, {
      clientId: client.id,
      unitId: UNIT_A,
      title: 'Protected proposal',
      pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
      globalSalePrice: '1000.0000',
    });

    await expect(
      proposalsAccess.getById({ identityId: intruderId, sessionId: 'sid' }, created.proposal.id),
    ).rejects.toMatchObject({ code: COMMERCIAL_ERROR_CODES.DENIED });

    await expect(
      proposalsAccess.updateDraft(owner.actor, created.proposal.id, 1, {
        rowVersion: created.currentVersion!.rowVersion + 99,
        title: 'Stale',
      }),
    ).rejects.toMatchObject({ code: COMMERCIAL_ERROR_CODES.VERSION_CONFLICT });
  });

  it('rejects, expires, cancels and links documents with audit trail', async () => {
    const { actor } = await seedActor();
    const client = await seedClient(actor);
    const created = await proposalsAccess.create(actor, {
      clientId: client.id,
      unitId: UNIT_A,
      title: 'Lifecycle proposal',
      pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
      globalSalePrice: '5000.0000',
    });
    const issued = await proposalsAccess.issue(
      actor,
      created.proposal.id,
      1,
      created.currentVersion!.rowVersion,
    );

    const doc = await documentsAccess.createWithUpload(
      actor,
      {
        title: 'Anexo proposta',
        categoryCode: DOCUMENT_CATEGORIES.General,
        classificationCode: 'INTERNAL',
        unitId: UNIT_A,
      },
      { buffer: minimalPdfBuffer(), filename: 'proposta.pdf', mimetype: 'application/pdf' },
    );

    const linked = await proposalsAccess.linkDocument(actor, created.proposal.id, 1, {
      documentId: doc.document.id,
      linkPurpose: PROPOSAL_DOCUMENT_LINK_PURPOSES.Attachment,
    });
    expect(linked.currentVersion?.documents).toHaveLength(1);

    const rejected = await proposalsAccess.reject(actor, created.proposal.id, 1, {
      rowVersion: issued.rowVersion,
      rejectionReason: 'Preço fora do orçamento',
    });
    expect(rejected.status).toBe(PROPOSAL_VERSION_STATUSES.Rejected);

    const revision = await proposalsAccess.createRevision(actor, created.proposal.id);
    const issuedV2 = await proposalsAccess.issue(
      actor,
      created.proposal.id,
      revision.currentVersion!.versionNumber,
      revision.currentVersion!.rowVersion,
    );
    const expired = await proposalsAccess.expire(
      actor,
      created.proposal.id,
      issuedV2.versionNumber,
      issuedV2.rowVersion,
    );
    expect(expired.status).toBe(PROPOSAL_VERSION_STATUSES.Expired);

    const draft = await proposalsAccess.createRevision(actor, created.proposal.id);
    const cancelled = await proposalsAccess.cancel(actor, created.proposal.id, draft.currentVersion!.versionNumber, {
      rowVersion: draft.currentVersion!.rowVersion,
      cancellationReason: 'Cliente desistiu',
    });
    expect(cancelled.status).toBe(PROPOSAL_VERSION_STATUSES.Cancelled);

    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events
       WHERE resource_id = $1`,
      [created.proposal.id],
    );
    const actions = audit.rows.map((row) => row.action);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.CommercialProposalCreate);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.CommercialProposalIssue);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.CommercialProposalReject);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.CommercialProposalExpire);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.CommercialProposalCancel);
  });
});
