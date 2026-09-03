import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import type { CommercialSupplierPort, CommercialSupplierView } from '../../platform/bounded-contexts/enterprise-core-ports';
import { assertUuid } from '../../platform/kernel/uuid';
import { SupplierError, assertSupplierActive } from '../domain/supplier';
import {
  assertCreateSupplierInput,
  assertDeactivationReason,
  assertUpdateSupplierInput,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from '../domain/supplier.validation';
import { SuppliersRepository } from '../repositories/suppliers.repository';
import {
  toSupplierResponse,
  type SupplierHistoryResponse,
  type SupplierResponse,
} from '../serializers/supplier-response.serializer';
import { SupplierAccessAuthz } from './supplier-access.authz';
import { mapSupplierDomainError } from './supplier-access.errors';

@Injectable()
export class SupplierAccessService implements CommercialSupplierPort {
  constructor(
    private readonly repository: SuppliersRepository,
    private readonly authz: SupplierAccessAuthz,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(actor: IdentityAuthzContext, input: CreateSupplierInput): Promise<SupplierResponse> {
    try {
      await this.authz.assertSupplierAction(actor, AUTHZ_ACTIONS.SupplierCreate, {
        id: actor.identityId,
      });
      const validated = assertCreateSupplierInput(input);
      const created = await this.repository.create({
        legalName: input.legalName,
        tradeName: input.tradeName,
        normalizedTaxId: validated.normalizedTaxId,
        externalErpId: input.externalErpId,
        paymentTerms: input.paymentTerms,
        currencyCode: validated.currencyCode,
        contacts: input.contacts,
        addresses: input.addresses,
        actorIdentityId: actor.identityId,
      });
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.SupplierCreate, created.id);
      return this.assemble(created.id);
    } catch (error) {
      if (isUniqueTaxIdViolation(error)) {
        throw mapSupplierDomainError(new SupplierError('SUPPLIER_TAX_ID_CONFLICT'));
      }
      throw mapSupplierDomainError(error);
    }
  }

  async getById(actor: IdentityAuthzContext, supplierId: string): Promise<SupplierResponse> {
    assertUuid(supplierId, 'supplierId');
    try {
      const row = await this.repository.findRowById(supplierId);
      if (!row) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      await this.authz.assertSupplierAction(actor, AUTHZ_ACTIONS.SupplierRead, { id: row.id });
      return this.assemble(row.id);
    } catch (error) {
      throw mapSupplierDomainError(error);
    }
  }

  async update(
    actor: IdentityAuthzContext,
    supplierId: string,
    input: UpdateSupplierInput,
  ): Promise<SupplierResponse> {
    assertUuid(supplierId, 'supplierId');
    try {
      assertUpdateSupplierInput(input);
      const existing = await this.repository.findRowById(supplierId);
      if (!existing) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      await this.authz.assertSupplierAction(actor, AUTHZ_ACTIONS.SupplierUpdate, { id: existing.id });
      const updated = await this.repository.update({
        supplierId,
        expectedVersion: input.version,
        legalName: input.legalName,
        tradeName: input.tradeName,
        externalErpId: input.externalErpId,
        paymentTerms: input.paymentTerms,
        currencyCode: input.currencyCode,
        actorIdentityId: actor.identityId,
      });
      if (updated === null) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      if (updated === 'VERSION_CONFLICT') {
        throw new SupplierError('SUPPLIER_VERSION_CONFLICT');
      }
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.SupplierUpdate, supplierId);
      return this.assemble(supplierId);
    } catch (error) {
      throw mapSupplierDomainError(error);
    }
  }

  async deactivate(
    actor: IdentityAuthzContext,
    supplierId: string,
    version: number,
    reason: string,
  ): Promise<SupplierResponse> {
    assertUuid(supplierId, 'supplierId');
    try {
      assertDeactivationReason(reason);
      const existing = await this.repository.findRowById(supplierId);
      if (!existing) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      await this.authz.assertSupplierAction(actor, AUTHZ_ACTIONS.SupplierDeactivate, { id: existing.id });
      const updated = await this.repository.setStatus({
        supplierId,
        expectedVersion: version,
        status: 'INACTIVE',
        actorIdentityId: actor.identityId,
        reason,
      });
      if (updated === null) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      if (updated === 'VERSION_CONFLICT') {
        throw new SupplierError('SUPPLIER_VERSION_CONFLICT');
      }
      if (updated === 'INVALID_STATE') {
        throw new SupplierError('SUPPLIER_INVALID_STATE');
      }
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.SupplierDeactivate, supplierId);
      return this.assemble(supplierId);
    } catch (error) {
      throw mapSupplierDomainError(error);
    }
  }

  async activate(actor: IdentityAuthzContext, supplierId: string, version: number): Promise<SupplierResponse> {
    assertUuid(supplierId, 'supplierId');
    try {
      const existing = await this.repository.findRowById(supplierId);
      if (!existing) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      await this.authz.assertSupplierAction(actor, AUTHZ_ACTIONS.SupplierActivate, { id: existing.id });
      const updated = await this.repository.setStatus({
        supplierId,
        expectedVersion: version,
        status: 'ACTIVE',
        actorIdentityId: actor.identityId,
      });
      if (updated === null) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      if (updated === 'VERSION_CONFLICT') {
        throw new SupplierError('SUPPLIER_VERSION_CONFLICT');
      }
      if (updated === 'INVALID_STATE') {
        throw new SupplierError('SUPPLIER_INVALID_STATE');
      }
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.SupplierActivate, supplierId);
      return this.assemble(supplierId);
    } catch (error) {
      throw mapSupplierDomainError(error);
    }
  }

  async history(actor: IdentityAuthzContext, supplierId: string): Promise<SupplierHistoryResponse[]> {
    assertUuid(supplierId, 'supplierId');
    try {
      const existing = await this.repository.findRowById(supplierId);
      if (!existing) {
        throw new SupplierError('SUPPLIER_NOT_FOUND');
      }
      await this.authz.assertSupplierAction(actor, AUTHZ_ACTIONS.SupplierRead, { id: existing.id });
      const rows = await this.repository.listHistory(supplierId);
      return rows.map((item) => ({
        id: item.id,
        eventKind: item.event_kind,
        actorIdentityId: item.actor_identity_id,
        occurredAt: item.occurred_at instanceof Date ? item.occurred_at.toISOString() : String(item.occurred_at),
      }));
    } catch (error) {
      throw mapSupplierDomainError(error);
    }
  }

  async findPublishedById(supplierId: string): Promise<CommercialSupplierView | null> {
    const row = await this.repository.findPublishedById(supplierId);
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      status: row.status,
      currencyCode: row.currency_code,
      paymentTerms: row.payment_terms,
    };
  }

  async requireActive(supplierId: string): Promise<CommercialSupplierView> {
    const published = await this.findPublishedById(supplierId);
    if (!published) {
      throw new SupplierError('SUPPLIER_NOT_FOUND');
    }
    assertSupplierActive(published.status);
    return published;
  }

  async assertNotInactive(supplierId: string): Promise<void> {
    const published = await this.findPublishedById(supplierId);
    if (published) {
      assertSupplierActive(published.status);
    }
  }

  private async assemble(supplierId: string): Promise<SupplierResponse> {
    const row = await this.repository.findRowById(supplierId);
    if (!row) {
      throw new SupplierError('SUPPLIER_NOT_FOUND');
    }
    const [contacts, addresses] = await Promise.all([
      this.repository.listContacts(supplierId),
      this.repository.listAddresses(supplierId),
    ]);
    return toSupplierResponse(row, contacts, addresses);
  }

  private async audit(
    actor: IdentityAuthzContext,
    action: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
    resourceId: string,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Supplier,
      resourceId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });
  }
}

function isUniqueTaxIdViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}
