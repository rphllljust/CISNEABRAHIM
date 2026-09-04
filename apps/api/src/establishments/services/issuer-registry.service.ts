import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
  type SecurityAuditAction,
  type SecurityAuditResourceType,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AUTHZ_ACTIONS, type AuthzAction } from '../../authorization/types/authz-actions';
import {
  AUTHZ_RESOURCE_TYPES,
  type AuthzResourceType,
} from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { assertUuid } from '../../platform/kernel/uuid';
import { LegalEstablishmentError } from '../domain/legal-establishment';
import {
  assertStatusTransition,
  isValidTaxNumberFormat,
  normalizeTaxNumber,
} from '../domain/legal-establishment';
import {
  validateCreateCertificateInput,
  validateCreateEstablishmentInput,
  validateCreateLegalEntityInput,
  validateCreateTaxRegistrationInput,
  validateStatusTransitionInput,
  validateUpdateCertificateInput,
  validateUpdateEstablishmentInput,
  validateUpdateLegalEntityInput,
  validateUpdateTaxRegistrationInput,
  type CreateCertificateInput,
  type CreateEstablishmentInput,
  type CreateLegalEntityInput,
  type CreateTaxRegistrationInput,
  type StatusTransitionInput,
  type UpdateCertificateInput,
  type UpdateEstablishmentInput,
  type UpdateLegalEntityInput,
  type UpdateTaxRegistrationInput,
} from '../domain/legal-establishment.validation';
import { EstablishmentRegistryRepository } from '../repositories/establishment-registry.repository';
import type {
  DefaultIssuerView,
} from '../repositories/establishment-registry.repository.types';
import {
  toCertificateResponse,
  toEstablishmentDetailResponse,
  toEstablishmentResponse,
  toHistoryEventResponse,
  toLegalEntityResponse,
  toTaxRegistrationResponse,
  type CertificateResponse,
  type EstablishmentDetailResponse,
  type EstablishmentResponse,
  type HistoryEventResponse,
  type LegalEntityResponse,
  type TaxRegistrationResponse,
} from '../serializers/establishment-registry-response.serializer';
import { mapRegistryError, registryDenied } from './establishment-registry-access.errors';

@Injectable()
export class IssuerRegistryService {
  constructor(
    private readonly repository: EstablishmentRegistryRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  // ---------- Legal entities ----------

  async createLegalEntity(
    actor: IdentityAuthzContext,
    input: CreateLegalEntityInput,
  ): Promise<LegalEntityResponse> {
    try {
      validateCreateLegalEntityInput(input);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerLegalEntityCreate, AUTHZ_RESOURCE_TYPES.IssuerLegalEntity);
      const row = await this.repository.createLegalEntity({
        legalName: input.legalName,
        tradeName: input.tradeName ?? null,
        actorIdentityId: actor.identityId,
      });
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerLegalEntityCreate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerLegalEntity,
        row.id,
      );
      return toLegalEntityResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async updateLegalEntity(
    actor: IdentityAuthzContext,
    legalEntityId: string,
    input: UpdateLegalEntityInput,
  ): Promise<LegalEntityResponse> {
    assertUuid(legalEntityId, 'legalEntityId');
    try {
      validateUpdateLegalEntityInput(input);
      await this.requireLegalEntity(legalEntityId);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerLegalEntityUpdate, AUTHZ_RESOURCE_TYPES.IssuerLegalEntity, legalEntityId);
      const updated = await this.repository.updateLegalEntity({
        legalEntityId,
        expectedVersion: input.version,
        legalName: input.legalName,
        tradeName: input.tradeName,
        actorIdentityId: actor.identityId,
      });
      if (updated === null) {
        throw new LegalEstablishmentError('LEGAL_ENTITY_NOT_FOUND');
      }
      if (updated === 'VERSION_CONFLICT') {
        throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_INVALID_VERSION');
      }
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerLegalEntityUpdate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerLegalEntity,
        legalEntityId,
      );
      return toLegalEntityResponse(updated);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async getLegalEntity(actor: IdentityAuthzContext, legalEntityId: string): Promise<LegalEntityResponse> {
    assertUuid(legalEntityId, 'legalEntityId');
    try {
      const row = await this.requireLegalEntity(legalEntityId);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerLegalEntityRead, AUTHZ_RESOURCE_TYPES.IssuerLegalEntity, legalEntityId);
      return toLegalEntityResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listLegalEntities(actor: IdentityAuthzContext): Promise<LegalEntityResponse[]> {
    try {
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerLegalEntityList, AUTHZ_RESOURCE_TYPES.IssuerLegalEntity);
      const rows = await this.repository.listLegalEntities();
      return rows.map(toLegalEntityResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async setLegalEntityStatus(
    actor: IdentityAuthzContext,
    legalEntityId: string,
    input: StatusTransitionInput,
    target: 'ACTIVE' | 'INACTIVE',
  ): Promise<LegalEntityResponse> {
    assertUuid(legalEntityId, 'legalEntityId');
    try {
      validateStatusTransitionInput(input);
      const current = await this.requireLegalEntity(legalEntityId);
      assertStatusTransition(current.status, target);
      await this.assertAction(
        actor,
        target === 'INACTIVE' ? AUTHZ_ACTIONS.IssuerLegalEntityDeactivate : AUTHZ_ACTIONS.IssuerLegalEntityActivate,
        AUTHZ_RESOURCE_TYPES.IssuerLegalEntity,
        legalEntityId,
      );
      const updated = await this.repository.setLegalEntityStatus({
        id: legalEntityId,
        expectedVersion: input.version,
        status: target,
        actorIdentityId: actor.identityId,
        reason: input.reason,
      });
      return toLegalEntityResponse(this.requireUpdated(updated, 'LEGAL_ENTITY_NOT_FOUND'));
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listLegalEntityHistory(actor: IdentityAuthzContext, legalEntityId: string): Promise<HistoryEventResponse[]> {
    assertUuid(legalEntityId, 'legalEntityId');
    try {
      await this.requireLegalEntity(legalEntityId);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerLegalEntityRead, AUTHZ_RESOURCE_TYPES.IssuerLegalEntity, legalEntityId);
      return (await this.repository.listLegalEntityHistory(legalEntityId)).map(toHistoryEventResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  // ---------- Establishments ----------

  async createEstablishment(
    actor: IdentityAuthzContext,
    input: CreateEstablishmentInput,
  ): Promise<EstablishmentResponse> {
    try {
      validateCreateEstablishmentInput(input);
      const legal = await this.repository.findLegalEntityById(input.legalEntityId);
      if (!legal) {
        throw new LegalEstablishmentError('LEGAL_ENTITY_NOT_FOUND');
      }
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerEstablishmentCreate, AUTHZ_RESOURCE_TYPES.IssuerEstablishment, input.legalEntityId);
      const row = await this.repository.createEstablishment({
        legalEntityId: input.legalEntityId,
        code: input.code,
        tradeName: input.tradeName ?? null,
        isDefaultIssuer: input.isDefaultIssuer,
        address: {
          street: input.street ?? null,
          number: input.number ?? null,
          complement: input.complement ?? null,
          district: input.district ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          postalCode: input.postalCode ?? null,
          country: input.country ?? null,
        },
        actorIdentityId: actor.identityId,
      });
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerEstablishmentCreate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerEstablishment,
        row.id,
      );
      return toEstablishmentResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async getEstablishment(actor: IdentityAuthzContext, establishmentId: string): Promise<EstablishmentDetailResponse> {
    assertUuid(establishmentId, 'establishmentId');
    try {
      const row = await this.repository.findEstablishmentRowById(establishmentId);
      if (!row) {
        throw new LegalEstablishmentError('ESTABLISHMENT_NOT_FOUND');
      }
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerEstablishmentRead, AUTHZ_RESOURCE_TYPES.IssuerEstablishment, establishmentId);
      const detail = await this.repository.findEstablishmentById(establishmentId);
      return toEstablishmentDetailResponse(detail!);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listEstablishments(actor: IdentityAuthzContext, legalEntityId: string): Promise<EstablishmentResponse[]> {
    assertUuid(legalEntityId, 'legalEntityId');
    try {
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerEstablishmentList, AUTHZ_RESOURCE_TYPES.IssuerEstablishment);
      const rows = await this.repository.listEstablishments(legalEntityId);
      return rows.map(toEstablishmentResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async updateEstablishment(
    actor: IdentityAuthzContext,
    establishmentId: string,
    input: UpdateEstablishmentInput,
  ): Promise<EstablishmentResponse> {
    assertUuid(establishmentId, 'establishmentId');
    try {
      validateUpdateEstablishmentInput(input);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerEstablishmentUpdate, AUTHZ_RESOURCE_TYPES.IssuerEstablishment, establishmentId);
      const updated = await this.repository.updateEstablishment({
        establishmentId,
        expectedVersion: input.version,
        tradeName: input.tradeName,
        isDefaultIssuer: input.isDefaultIssuer,
        address: {
          street: input.street ?? null,
          number: input.number ?? null,
          complement: input.complement ?? null,
          district: input.district ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          postalCode: input.postalCode ?? null,
          country: input.country ?? null,
        },
        actorIdentityId: actor.identityId,
      });
      const row = this.requireUpdated(updated, 'ESTABLISHMENT_NOT_FOUND');
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerEstablishmentUpdate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerEstablishment,
        establishmentId,
      );
      return toEstablishmentResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async setEstablishmentStatus(
    actor: IdentityAuthzContext,
    establishmentId: string,
    input: StatusTransitionInput,
    target: 'ACTIVE' | 'INACTIVE',
  ): Promise<EstablishmentResponse> {
    assertUuid(establishmentId, 'establishmentId');
    try {
      validateStatusTransitionInput(input);
      const current = await this.repository.findEstablishmentRowById(establishmentId);
      if (!current) {
        throw new LegalEstablishmentError('ESTABLISHMENT_NOT_FOUND');
      }
      assertStatusTransition(current.status, target);
      await this.assertAction(
        actor,
        target === 'INACTIVE' ? AUTHZ_ACTIONS.IssuerEstablishmentDeactivate : AUTHZ_ACTIONS.IssuerEstablishmentActivate,
        AUTHZ_RESOURCE_TYPES.IssuerEstablishment,
        establishmentId,
      );
      const updated = await this.repository.setEstablishmentStatus({
        id: establishmentId,
        expectedVersion: input.version,
        status: target,
        actorIdentityId: actor.identityId,
        reason: input.reason,
      });
      const row = this.requireUpdated(updated, 'ESTABLISHMENT_NOT_FOUND');
      await this.audit(
        actor,
        target === 'INACTIVE'
          ? SECURITY_AUDIT_ACTIONS.IssuerEstablishmentDeactivate
          : SECURITY_AUDIT_ACTIONS.IssuerEstablishmentActivate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerEstablishment,
        establishmentId,
      );
      return toEstablishmentResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listEstablishmentHistory(actor: IdentityAuthzContext, establishmentId: string): Promise<HistoryEventResponse[]> {
    assertUuid(establishmentId, 'establishmentId');
    try {
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerEstablishmentRead, AUTHZ_RESOURCE_TYPES.IssuerEstablishment, establishmentId);
      return (await this.repository.listEstablishmentHistory(establishmentId)).map(toHistoryEventResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  // ---------- Tax registrations ----------

  async createTaxRegistration(
    actor: IdentityAuthzContext,
    input: CreateTaxRegistrationInput,
  ): Promise<TaxRegistrationResponse> {
    try {
      validateCreateTaxRegistrationInput(input);
      await this.requireEstablishment(input.establishmentId);
      await this.assertAction(
        actor,
        AUTHZ_ACTIONS.IssuerTaxRegistrationCreate,
        AUTHZ_RESOURCE_TYPES.IssuerTaxRegistration,
        input.establishmentId,
      );
      const kind = input.taxKind;
      if (!isValidTaxNumberFormat(kind, input.number)) {
        throw new LegalEstablishmentError('TAX_REGISTRATION_INVALID_NUMBER');
      }
      const row = await this.repository.createTaxRegistration({
        establishmentId: input.establishmentId,
        taxKind: kind,
        normalizedNumber: normalizeTaxNumber(kind, input.number),
        state: input.state ?? null,
        regime: input.regime ?? null,
        validFrom: input.validFrom ?? null,
        validTo: input.validTo ?? null,
        authority: input.authority ?? null,
        actorIdentityId: actor.identityId,
      });
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerTaxRegistrationCreate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerTaxRegistration,
        row.id,
      );
      return toTaxRegistrationResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async updateTaxRegistration(
    actor: IdentityAuthzContext,
    taxRegistrationId: string,
    input: UpdateTaxRegistrationInput,
  ): Promise<TaxRegistrationResponse> {
    assertUuid(taxRegistrationId, 'taxRegistrationId');
    try {
      validateUpdateTaxRegistrationInput(input);
      await this.assertAction(
        actor,
        AUTHZ_ACTIONS.IssuerTaxRegistrationUpdate,
        AUTHZ_RESOURCE_TYPES.IssuerTaxRegistration,
        taxRegistrationId,
      );
      const updated = await this.repository.updateTaxRegistration({
        taxRegistrationId,
        expectedVersion: input.version,
        state: input.state,
        regime: input.regime,
        validFrom: input.validFrom,
        validTo: input.validTo,
        authority: input.authority,
        actorIdentityId: actor.identityId,
      });
      const row = this.requireUpdated(updated, 'TAX_REGISTRATION_NOT_FOUND');
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerTaxRegistrationUpdate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerTaxRegistration,
        taxRegistrationId,
      );
      return toTaxRegistrationResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async setTaxRegistrationStatus(
    actor: IdentityAuthzContext,
    taxRegistrationId: string,
    input: StatusTransitionInput,
    target: 'ACTIVE' | 'INACTIVE',
  ): Promise<TaxRegistrationResponse> {
    assertUuid(taxRegistrationId, 'taxRegistrationId');
    try {
      validateStatusTransitionInput(input);
      const current = await this.repository.findTaxRegistrationById(taxRegistrationId);
      if (!current) {
        throw new LegalEstablishmentError('TAX_REGISTRATION_NOT_FOUND');
      }
      assertStatusTransition(current.status, target);
      await this.assertAction(
        actor,
        target === 'INACTIVE'
          ? AUTHZ_ACTIONS.IssuerTaxRegistrationDeactivate
          : AUTHZ_ACTIONS.IssuerTaxRegistrationActivate,
        AUTHZ_RESOURCE_TYPES.IssuerTaxRegistration,
        taxRegistrationId,
      );
      const updated = await this.repository.setTaxRegistrationStatus({
        id: taxRegistrationId,
        expectedVersion: input.version,
        status: target,
        actorIdentityId: actor.identityId,
        reason: input.reason,
      });
      const row = this.requireUpdated(updated, 'TAX_REGISTRATION_NOT_FOUND');
      await this.audit(
        actor,
        target === 'INACTIVE'
          ? SECURITY_AUDIT_ACTIONS.IssuerTaxRegistrationDeactivate
          : SECURITY_AUDIT_ACTIONS.IssuerTaxRegistrationActivate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerTaxRegistration,
        taxRegistrationId,
      );
      return toTaxRegistrationResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listTaxRegistrations(actor: IdentityAuthzContext, establishmentId: string): Promise<TaxRegistrationResponse[]> {
    assertUuid(establishmentId, 'establishmentId');
    try {
      await this.requireEstablishment(establishmentId);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerTaxRegistrationList, AUTHZ_RESOURCE_TYPES.IssuerTaxRegistration, establishmentId);
      return (await this.repository.listTaxRegistrations(establishmentId)).map(toTaxRegistrationResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listTaxRegistrationHistory(
    actor: IdentityAuthzContext,
    taxRegistrationId: string,
  ): Promise<HistoryEventResponse[]> {
    assertUuid(taxRegistrationId, 'taxRegistrationId');
    try {
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerTaxRegistrationRead, AUTHZ_RESOURCE_TYPES.IssuerTaxRegistration, taxRegistrationId);
      return (await this.repository.listTaxRegistrationHistory(taxRegistrationId)).map(toHistoryEventResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  // ---------- Certificates ----------

  async createCertificate(
    actor: IdentityAuthzContext,
    input: CreateCertificateInput,
  ): Promise<CertificateResponse> {
    try {
      validateCreateCertificateInput(input);
      await this.requireEstablishment(input.establishmentId);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerCertificateCreate, AUTHZ_RESOURCE_TYPES.IssuerCertificate, input.establishmentId);
      const row = await this.repository.createCertificate({
        establishmentId: input.establishmentId,
        certificateKind: input.certificateKind,
        label: input.label,
        subjectRef: input.subjectRef ?? null,
        issuerRef: input.issuerRef ?? null,
        validFrom: input.validFrom ?? null,
        validTo: input.validTo ?? null,
        actorIdentityId: actor.identityId,
      });
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerCertificateCreate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerCertificate,
        row.id,
      );
      return toCertificateResponse(row);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async listCertificates(actor: IdentityAuthzContext, establishmentId: string): Promise<CertificateResponse[]> {
    assertUuid(establishmentId, 'establishmentId');
    try {
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerCertificateList, AUTHZ_RESOURCE_TYPES.IssuerCertificate, establishmentId);
      return (await this.repository.listCertificates(establishmentId)).map(toCertificateResponse);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  async updateCertificate(
    actor: IdentityAuthzContext,
    certificateId: string,
    input: UpdateCertificateInput,
  ): Promise<CertificateResponse> {
    assertUuid(certificateId, 'certificateId');
    try {
      validateUpdateCertificateInput(input);
      await this.assertAction(actor, AUTHZ_ACTIONS.IssuerCertificateUpdate, AUTHZ_RESOURCE_TYPES.IssuerCertificate, certificateId);
      const updated = await this.repository.updateCertificate({
        certificateId,
        certificateKind: input.certificateKind,
        label: input.label,
        subjectRef: input.subjectRef,
        issuerRef: input.issuerRef,
        validFrom: input.validFrom,
        validTo: input.validTo,
        actorIdentityId: actor.identityId,
      });
      if (!updated) {
        throw new LegalEstablishmentError('CERTIFICATE_NOT_FOUND');
      }
      await this.audit(
        actor,
        SECURITY_AUDIT_ACTIONS.IssuerCertificateUpdate,
        SECURITY_AUDIT_RESOURCE_TYPES.IssuerCertificate,
        certificateId,
      );
      return toCertificateResponse(updated);
    } catch (error) {
      throw mapRegistryError(error);
    }
  }

  // ---------- Internal read boundary (used by fiscal/billing; no hardcoded data) ----------

  async resolveDefaultIssuer(): Promise<DefaultIssuerView> {
    const issuer = await this.repository.findDefaultIssuer();
    if (!issuer) {
      throw new LegalEstablishmentError('DEFAULT_ISSUER_NOT_FOUND');
    }
    if (!issuer.normalizedCnpj) {
      throw new LegalEstablishmentError('ESTABLISHMENT_ISSUER_CNPJ_REQUIRED');
    }
    return issuer;
  }

  async findDefaultIssuer(): Promise<DefaultIssuerView | null> {
    return this.repository.findDefaultIssuer();
  }

  /**
   * Emissor autoritativo de um estabelecimento (FiscalDocument). Exige CNPJ
   * ATIVO registrado no cadastro — nunca dados hardcoded.
   */
  async resolveEstablishmentIssuer(establishmentId: string): Promise<DefaultIssuerView> {
    const issuer = await this.repository.findEstablishmentIssuer(establishmentId);
    if (!issuer) {
      throw new LegalEstablishmentError('ESTABLISHMENT_NOT_FOUND');
    }
    if (!issuer.normalizedCnpj) {
      throw new LegalEstablishmentError('ESTABLISHMENT_ISSUER_CNPJ_REQUIRED');
    }
    return issuer;
  }

  // ---------- Helpers ----------

  private requireUpdated<T>(outcome: T | 'VERSION_CONFLICT' | null, notFoundCode: string): T {
    if (outcome === null) {
      throw new LegalEstablishmentError(notFoundCode);
    }
    if (outcome === 'VERSION_CONFLICT') {
      throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_INVALID_VERSION');
    }
    return outcome;
  }

  private async requireLegalEntity(legalEntityId: string) {
    const row = await this.repository.findLegalEntityById(legalEntityId);
    if (!row) {
      throw new LegalEstablishmentError('LEGAL_ENTITY_NOT_FOUND');
    }
    return row;
  }

  private async requireEstablishment(establishmentId: string) {
    const row = await this.repository.findEstablishmentRowById(establishmentId);
    if (!row) {
      throw new LegalEstablishmentError('ESTABLISHMENT_NOT_FOUND');
    }
    return row;
  }

  private async assertAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    resourceType: AuthzResourceType,
    resourceId?: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      { identityId: actor.identityId, sessionId: actor.sessionId },
      {
        action,
        resourceType,
        context: resourceId ? { resourceId } : undefined,
      },
      { audit: false },
    );
    if (decision.result === 'DENY') {
      throw registryDenied();
    }
  }

  private async audit(
    actor: IdentityAuthzContext,
    action: SecurityAuditAction,
    resourceType: SecurityAuditResourceType,
    resourceId: string,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action,
      resourceType,
      resourceId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: {},
    });
  }
}
