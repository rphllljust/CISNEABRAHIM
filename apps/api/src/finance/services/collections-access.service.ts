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
import { assertUuid } from '../../platform/kernel/uuid';
import { CollectionError, assertCanOpenCollection } from '../domain/collection';
import {
  validateRecordCollectionActionInput,
  validateRecordCollectionPromiseInput,
  validateRenegotiateCollectionInput,
  type RecordCollectionActionInput,
  type RecordCollectionPromiseInput,
  type RenegotiateCollectionInput,
} from '../domain/collection.validation';
import { postedSettlementAmounts } from '../domain/receivable';
import { CollectionsRepository } from '../repositories/collections.repository';
import { ReceivablesRepository } from '../repositories/receivables.repository';
import {
  toCollectionResponse,
  toHistoryItem,
  type CollectionResponse,
} from '../serializers/collections-response.serializer';
import { CollectionsAccessAuthz } from './collections-access.authz';
import { mapCollectionError } from './collections-access.errors';

@Injectable()
export class CollectionsAccessService {
  constructor(
    private readonly collections: CollectionsRepository,
    private readonly receivables: ReceivablesRepository,
    private readonly authz: CollectionsAccessAuthz,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async open(actor: IdentityAuthzContext, receivableId: string): Promise<CollectionResponse> {
    assertUuid(receivableId, 'receivableId');
    try {
      const receivable = await this.requireReceivable(receivableId);
      await this.authz.assertCollectionAction(actor, AUTHZ_ACTIONS.FinanceCollectionOpen, {
        id: receivable.id,
        unitId: receivable.unit_id,
        clientId: receivable.client_id,
      });
      const settlements = await this.receivables.listSettlements(receivable.id);
      assertCanOpenCollection({
        lifecycle: receivable.lifecycle,
        principal: receivable.principal,
        postedAmounts: postedSettlementAmounts(settlements),
        dueDate: receivable.due_date,
      });
      const opened = await this.collections.openCase({
        receivableId: receivable.id,
        unitId: receivable.unit_id,
        clientId: receivable.client_id,
        actorIdentityId: actor.identityId,
      });
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.FinanceCollectionOpen, opened.collection.id);
      return toCollectionResponse(opened);
    } catch (error) {
      throw mapCollectionError(error);
    }
  }

  async getCurrent(actor: IdentityAuthzContext, receivableId: string): Promise<CollectionResponse> {
    assertUuid(receivableId, 'receivableId');
    try {
      const receivable = await this.requireReceivable(receivableId);
      await this.authz.assertCollectionAction(actor, AUTHZ_ACTIONS.FinanceCollectionRead, {
        id: receivable.id,
        unitId: receivable.unit_id,
        clientId: receivable.client_id,
      });
      const current = await this.collections.findOpenByReceivableId(receivable.id);
      if (!current) {
        throw new CollectionError('COLLECTION_NOT_FOUND');
      }
      return toCollectionResponse(current);
    } catch (error) {
      throw mapCollectionError(error);
    }
  }

  async recordAction(
    actor: IdentityAuthzContext,
    collectionId: string,
    input: RecordCollectionActionInput,
  ): Promise<CollectionResponse> {
    assertUuid(collectionId, 'collectionId');
    try {
      const validated = validateRecordCollectionActionInput(input);
      await this.assertOnCollection(actor, collectionId, AUTHZ_ACTIONS.FinanceCollectionActionCreate);
      const recorded = await this.collections.recordAction({
        collectionId,
        kind: validated.kind,
        notes: validated.notes,
        idempotencyKey: validated.idempotencyKey,
        actorIdentityId: actor.identityId,
      });
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.FinanceCollectionActionCreate, collectionId);
      return toCollectionResponse(recorded);
    } catch (error) {
      throw mapCollectionError(error);
    }
  }

  async recordPromise(
    actor: IdentityAuthzContext,
    collectionId: string,
    input: RecordCollectionPromiseInput,
  ): Promise<CollectionResponse> {
    assertUuid(collectionId, 'collectionId');
    try {
      const validated = validateRecordCollectionPromiseInput(input);
      await this.assertOnCollection(actor, collectionId, AUTHZ_ACTIONS.FinanceCollectionPromiseCreate);
      const recorded = await this.collections.recordPromise({
        collectionId,
        promisedAmount: validated.promisedAmount,
        promisedOn: validated.promisedOn,
        notes: validated.notes,
        idempotencyKey: validated.idempotencyKey,
        actorIdentityId: actor.identityId,
      });
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.FinanceCollectionPromiseCreate, collectionId);
      return toCollectionResponse(recorded);
    } catch (error) {
      throw mapCollectionError(error);
    }
  }

  async renegotiate(
    actor: IdentityAuthzContext,
    collectionId: string,
    input: RenegotiateCollectionInput,
  ): Promise<CollectionResponse> {
    assertUuid(collectionId, 'collectionId');
    try {
      const validated = validateRenegotiateCollectionInput(input);
      await this.assertOnCollection(actor, collectionId, AUTHZ_ACTIONS.FinanceCollectionRenegotiate);
      const result = await this.collections.renegotiate({
        collectionId,
        expectedVersion: validated.version,
        promisedDueDate: validated.promisedDueDate,
        promisedAmount: validated.promisedAmount,
        promisedOn: validated.promisedOn,
        notes: validated.notes,
        idempotencyKey: validated.idempotencyKey,
        actorIdentityId: actor.identityId,
      });
      if (result === 'VERSION_CONFLICT') {
        throw new CollectionError('COLLECTION_VERSION_CONFLICT');
      }
      await this.audit(actor, SECURITY_AUDIT_ACTIONS.FinanceCollectionRenegotiate, collectionId);
      return toCollectionResponse(result);
    } catch (error) {
      throw mapCollectionError(error);
    }
  }

  async listHistory(actor: IdentityAuthzContext, collectionId: string) {
    assertUuid(collectionId, 'collectionId');
    try {
      await this.assertOnCollection(actor, collectionId, AUTHZ_ACTIONS.FinanceCollectionRead);
      const history = await this.collections.listHistory(collectionId);
      return history.map((item) => toHistoryItem(item));
    } catch (error) {
      throw mapCollectionError(error);
    }
  }

  private async requireReceivable(receivableId: string) {
    const receivable = await this.receivables.findById(receivableId);
    if (!receivable) {
      throw new CollectionError('COLLECTION_NOT_FOUND');
    }
    return receivable;
  }

  private async assertOnCollection(
    actor: IdentityAuthzContext,
    collectionId: string,
    action: (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS],
  ) {
    const current = await this.collections.findById(collectionId);
    if (!current) {
      throw new CollectionError('COLLECTION_NOT_FOUND');
    }
    await this.authz.assertCollectionAction(actor, action, {
      id: current.collection.id,
      unitId: current.collection.unit_id,
      clientId: current.collection.client_id,
    });
    return current;
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
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.FinanceCollection,
      resourceId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Critical,
      metadata: {},
    });
  }
}
