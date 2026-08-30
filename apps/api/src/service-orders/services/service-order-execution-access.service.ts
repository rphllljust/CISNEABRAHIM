import { HttpStatus, Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { DomainEventsRecorderService } from '../../events/services/domain-events-recorder.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { toResourceContextFromServiceOrder } from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import type { ClientStatus } from '../../clients/domain/client-status';
import {
  assertEvidenceKindInSnapshot,
  assertExecutionCompletePreconditions,
  assertExecutionOperationalState,
  assertExecutionStartPreconditions,
  assertUnitAllowed,
  collectSatisfiedEvidenceKinds,
  EXECUTION_COMMANDS,
  EXECUTION_ENTRY_TYPES,
  EXECUTION_RECORDING_ALLOWED_STATUSES,
  mapEntryTypeToEvidenceKind,
  ServiceOrderExecutionError,
} from '../domain/service-order-execution';
import {
  ServiceOrderExecutionValidationError,
  validateRecordEvidenceInput,
  validateRecordMeasuredValueInput,
  validateRecordObservationInput,
  validateRecordOccurrenceInput,
  validateRecordQuantityInput,
  validateRowVersionCommandInput,
  type RecordEvidenceInput,
  type RecordMeasuredValueInput,
  type RecordObservationInput,
  type RecordOccurrenceInput,
  type RecordQuantityInput,
  type RowVersionCommandInput,
} from '../domain/service-order-execution.validation';
import type { ServiceOrderServiceSnapshot } from '../domain/service-order-snapshot';
import { SERVICE_ORDER_STATUSES } from '../domain/service-order';
import { assertTransition, ServiceOrderStateError } from '../domain/service-order.state-machine';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { ServiceOrderExecutionRepository } from '../repositories/service-order-execution.repository';
import type {
  ExecutionEntryRow,
  ExecutionEvidenceRow,
  ExecutionOccurrenceRow,
} from '../repositories/service-order-execution.repository.types';
import { ServiceOrdersRepository } from '../repositories/service-orders.repository';
import type { ServiceOrderRow } from '../repositories/service-orders.repository.types';
import {
  toExecutionBundleResponse,
  toExecutionEntryResponse,
  toExecutionEvidenceResponse,
  toExecutionOccurrenceResponse,
  type ExecutionBundleResponse,
} from '../serializers/service-order-execution-response.serializer';
import { toServiceOrderDetailResponse } from '../serializers/service-orders-response.serializer';

@Injectable()
export class ServiceOrderExecutionAccessService {
  constructor(
    private readonly serviceOrdersRepository: ServiceOrdersRepository,
    private readonly executionRepository: ServiceOrderExecutionRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
    private readonly domainEventsRecorder: DomainEventsRecorderService,
  ) {}

  async getExecution(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ): Promise<ExecutionBundleResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersExecutionRead);
    const [entries, evidence, occurrences] = await Promise.all([
      this.executionRepository.listEntries(serviceOrderId),
      this.executionRepository.listEvidence(serviceOrderId),
      this.executionRepository.listOccurrences(serviceOrderId),
    ]);
    return toExecutionBundleResponse(order, entries, evidence, occurrences);
  }

  async start(actor: IdentityAuthzContext, serviceOrderId: string, input: RowVersionCommandInput) {
    return this.runTransition(actor, serviceOrderId, input, 'start', AUTHZ_ACTIONS.ServiceOrdersExecutionStart);
  }

  async pause(actor: IdentityAuthzContext, serviceOrderId: string, input: RowVersionCommandInput) {
    return this.runTransition(actor, serviceOrderId, input, 'pause', AUTHZ_ACTIONS.ServiceOrdersExecutionPause);
  }

  async resume(actor: IdentityAuthzContext, serviceOrderId: string, input: RowVersionCommandInput) {
    return this.runTransition(actor, serviceOrderId, input, 'resume', AUTHZ_ACTIONS.ServiceOrdersExecutionResume);
  }

  async complete(actor: IdentityAuthzContext, serviceOrderId: string, input: RowVersionCommandInput) {
    this.assertValidServiceOrderId(serviceOrderId);
    const order = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersExecutionComplete,
    );
    let validated: RowVersionCommandInput;
    try {
      validated = validateRowVersionCommandInput(input);
    } catch {
      throw this.validationFailed();
    }

    if (validated.idempotencyKey) {
      const existing = await this.executionRepository.findIdempotency(
        serviceOrderId,
        EXECUTION_COMMANDS.Complete,
        validated.idempotencyKey,
      );
      if (existing) {
        const history = await this.serviceOrdersRepository.listHistoryEvents(serviceOrderId);
        const refreshed = await this.serviceOrdersRepository.findById(serviceOrderId);
        return toServiceOrderDetailResponse(refreshed!, history);
      }
    }

    const [entries, evidence] = await Promise.all([
      this.executionRepository.listEntries(serviceOrderId),
      this.executionRepository.listEvidence(serviceOrderId),
    ]);
    const satisfied = collectSatisfiedEvidenceKinds({
      evidenceKinds: evidence.map((item) => item.evidence_kind),
      entryEvidenceKinds: entries.map((item) => item.evidence_kind ?? ''),
      entryTypes: entries.map((item) => item.entry_type as (typeof EXECUTION_ENTRY_TYPES)[keyof typeof EXECUTION_ENTRY_TYPES]),
    });

    try {
      assertExecutionCompletePreconditions(order.service_snapshot, satisfied);
    } catch (error) {
      if (error instanceof ServiceOrderExecutionError) {
        throw this.mapExecutionError(error);
      }
      throw error;
    }

    const nextStatus = assertTransition(order.status as typeof SERVICE_ORDER_STATUSES.Released, 'complete');
    const result = await this.executionRepository.transitionExecution({
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      currentStatus: order.status,
      nextStatus,
      transition: 'complete',
      commandName: EXECUTION_COMMANDS.Complete,
      idempotencyKey: validated.idempotencyKey,
      responsePayload: {},
    });

    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'invalid_state') {
      throw this.invalidState();
    }

    await this.audit(actor, SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionComplete, serviceOrderId, {
      rowVersion: result.rowVersion,
    });

    const history = await this.serviceOrdersRepository.listHistoryEvents(serviceOrderId);
    const refreshed = await this.serviceOrdersRepository.findById(serviceOrderId);
    if (refreshed?.completed_at) {
      await this.domainEventsRecorder.recordServiceOrderCompleted({
        serviceOrderId: refreshed.id,
        unitId: refreshed.unit_id,
        clientId: refreshed.client_id,
        orderNumber: refreshed.order_number,
        completedAt: refreshed.completed_at,
      });
    }
    return toServiceOrderDetailResponse(refreshed!, history);
  }

  async recordQuantity(actor: IdentityAuthzContext, serviceOrderId: string, input: RecordQuantityInput) {
    return this.recordMeasuredEntry(actor, serviceOrderId, input, EXECUTION_ENTRY_TYPES.Quantity, (validated) => {
      const quantity = validated as RecordQuantityInput;
      return {
        quantityValue: quantity.quantityValue,
        quantityUnitCode: quantity.unitCode,
        textValue: null,
      };
    });
  }

  async recordMileage(actor: IdentityAuthzContext, serviceOrderId: string, input: RecordMeasuredValueInput) {
    return this.recordMeasuredEntry(actor, serviceOrderId, input, EXECUTION_ENTRY_TYPES.Mileage, (validated) => {
      const measured = validated as RecordMeasuredValueInput;
      return {
        quantityValue: measured.value,
        quantityUnitCode: 'KM',
        textValue: null,
      };
    });
  }

  async recordHourMeter(actor: IdentityAuthzContext, serviceOrderId: string, input: RecordMeasuredValueInput) {
    return this.recordMeasuredEntry(actor, serviceOrderId, input, EXECUTION_ENTRY_TYPES.HourMeter, (validated) => {
      const measured = validated as RecordMeasuredValueInput;
      return {
        quantityValue: measured.value,
        quantityUnitCode: 'H',
        textValue: null,
      };
    });
  }

  async recordObservation(actor: IdentityAuthzContext, serviceOrderId: string, input: RecordObservationInput) {
    return this.recordMeasuredEntry(actor, serviceOrderId, input, EXECUTION_ENTRY_TYPES.Observation, (validated) => {
      const observation = validated as RecordObservationInput;
      return {
        quantityValue: null,
        quantityUnitCode: null,
        textValue: observation.text,
      };
    });
  }

  async recordOccurrence(actor: IdentityAuthzContext, serviceOrderId: string, input: RecordOccurrenceInput) {
    this.assertValidServiceOrderId(serviceOrderId);
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersExecutionRecord);
    let validated: RecordOccurrenceInput;
    try {
      validated = validateRecordOccurrenceInput(input);
      assertExecutionOperationalState(order.status, EXECUTION_RECORDING_ALLOWED_STATUSES);
    } catch (error) {
      if (error instanceof ServiceOrderExecutionValidationError) {
        throw this.validationFailed();
      }
      if (error instanceof ServiceOrderExecutionError) {
        throw this.mapExecutionError(error);
      }
      throw error;
    }

    const result = await this.executionRepository.recordOccurrence({
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      occurrenceCode: validated.occurrenceCode,
      description: validated.description,
      payload: validated.payload ?? {},
      idempotencyKey: validated.idempotencyKey,
    });

    return this.mapOccurrenceResult(result, actor, serviceOrderId);
  }

  async recordEvidence(actor: IdentityAuthzContext, serviceOrderId: string, input: RecordEvidenceInput) {
    this.assertValidServiceOrderId(serviceOrderId);
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersExecutionRecord);
    let validated: RecordEvidenceInput;
    try {
      validated = validateRecordEvidenceInput(input);
      assertExecutionOperationalState(order.status, EXECUTION_RECORDING_ALLOWED_STATUSES);
      const snapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
      assertEvidenceKindInSnapshot(snapshot, validated.evidenceKind);
    } catch (error) {
      if (error instanceof ServiceOrderExecutionValidationError) {
        throw this.validationFailed();
      }
      if (error instanceof ServiceOrderExecutionError) {
        throw this.mapExecutionError(error);
      }
      throw error;
    }

    const result = await this.executionRepository.recordEvidence({
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      evidenceKind: validated.evidenceKind,
      payload: validated.payload,
      idempotencyKey: validated.idempotencyKey,
    });

    return this.mapEvidenceResult(result, actor, serviceOrderId);
  }

  private async runTransition(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: RowVersionCommandInput,
    transition: 'start' | 'pause' | 'resume',
    action: AuthzAction,
  ) {
    this.assertValidServiceOrderId(serviceOrderId);
    const order = await this.requireServiceOrder(actor, serviceOrderId, action);
    let validated: RowVersionCommandInput;
    try {
      validated = validateRowVersionCommandInput(input);
    } catch {
      throw this.validationFailed();
    }

    const commandName =
      transition === 'start'
        ? EXECUTION_COMMANDS.Start
        : transition === 'pause'
          ? EXECUTION_COMMANDS.Pause
          : EXECUTION_COMMANDS.Resume;

    if (validated.idempotencyKey) {
      const existing = await this.executionRepository.findIdempotency(
        serviceOrderId,
        commandName,
        validated.idempotencyKey,
      );
      if (existing) {
        const history = await this.serviceOrdersRepository.listHistoryEvents(serviceOrderId);
        const refreshed = await this.serviceOrdersRepository.findById(serviceOrderId);
        return toServiceOrderDetailResponse(refreshed!, history);
      }
    }

    let nextStatus: string;
    try {
      nextStatus = assertTransition(order.status as typeof SERVICE_ORDER_STATUSES.Released, transition);
    } catch (error) {
      if (error instanceof ServiceOrderStateError) {
        throw this.invalidState();
      }
      throw error;
    }

    if (transition === 'start') {
      const planned = await this.executionRepository.listPlannedResourceCoverage(serviceOrderId);
      const client = order.client_id
        ? await this.serviceOrdersRepository.findClientById(order.client_id)
        : null;
      try {
        assertExecutionStartPreconditions(
          order,
          planned.map((item) => ({
            requirementKind: item.requirement_kind,
            resourceTypeCode: item.resource_type_code,
            laborTypeCode: item.labor_type_code,
            plannedQuantity: item.planned_quantity,
            status: item.status,
          })),
          client ? { id: client.id, status: client.status as ClientStatus } : null,
        );
      } catch (error) {
        if (error instanceof ServiceOrderExecutionError) {
          throw this.mapExecutionError(error);
        }
        throw error;
      }
    }

    const result = await this.executionRepository.transitionExecution({
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      currentStatus: order.status,
      nextStatus,
      transition,
      commandName,
      idempotencyKey: validated.idempotencyKey,
      responsePayload: {},
    });

    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'invalid_state') {
      throw this.invalidState();
    }

    const auditAction =
      transition === 'start'
        ? SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionStart
        : transition === 'pause'
          ? SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionPause
          : SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionResume;
    await this.audit(actor, auditAction, serviceOrderId, { rowVersion: result.rowVersion });

    const history = await this.serviceOrdersRepository.listHistoryEvents(serviceOrderId);
    const refreshed = await this.serviceOrdersRepository.findById(serviceOrderId);
    return toServiceOrderDetailResponse(refreshed!, history);
  }

  private async recordMeasuredEntry(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: RecordQuantityInput | RecordMeasuredValueInput | RecordObservationInput,
    entryType: (typeof EXECUTION_ENTRY_TYPES)[keyof typeof EXECUTION_ENTRY_TYPES],
    mapValues: (
      validated: RecordQuantityInput | RecordMeasuredValueInput | RecordObservationInput,
    ) => { quantityValue: string | null; quantityUnitCode: string | null; textValue: string | null },
  ) {
    this.assertValidServiceOrderId(serviceOrderId);
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersExecutionRecord);
    let validated: RecordQuantityInput | RecordMeasuredValueInput | RecordObservationInput;
    try {
      if (entryType === EXECUTION_ENTRY_TYPES.Quantity) {
        validated = validateRecordQuantityInput(input);
        const snapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
        assertUnitAllowed(snapshot, validated.unitCode);
      } else if (entryType === EXECUTION_ENTRY_TYPES.Observation) {
        validated = validateRecordObservationInput(input);
      } else {
        validated = validateRecordMeasuredValueInput(input);
      }
      assertExecutionOperationalState(order.status, EXECUTION_RECORDING_ALLOWED_STATUSES);
      const evidenceKind = mapEntryTypeToEvidenceKind(entryType);
      if (evidenceKind) {
        const snapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
        assertEvidenceKindInSnapshot(snapshot, evidenceKind);
      }
    } catch (error) {
      if (error instanceof ServiceOrderExecutionValidationError) {
        throw this.validationFailed();
      }
      if (error instanceof ServiceOrderExecutionError) {
        throw this.mapExecutionError(error);
      }
      throw error;
    }

    const values = mapValues(validated);
    const result = await this.executionRepository.recordEntry({
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      entryType,
      evidenceKind: mapEntryTypeToEvidenceKind(entryType),
      quantityValue: values.quantityValue,
      quantityUnitCode: values.quantityUnitCode,
      textValue: values.textValue,
      context: 'context' in validated && validated.context ? validated.context : {},
      idempotencyKey: validated.idempotencyKey,
    });

    return this.mapEntryResult(result, actor, serviceOrderId);
  }

  private async mapEntryResult(
    result: Awaited<ReturnType<ServiceOrderExecutionRepository['recordEntry']>>,
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ) {
    if (result.outcome === 'idempotent') {
      return { entry: toExecutionEntryResponse(result.payload.entry as ExecutionEntryRow), rowVersion: null };
    }
    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'invalid_state') {
      throw this.invalidState();
    }
    await this.audit(actor, SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionRecord, serviceOrderId, {
      entryId: result.entry.id,
    });
    return { entry: toExecutionEntryResponse(result.entry), rowVersion: result.rowVersion };
  }

  private async mapEvidenceResult(
    result: Awaited<ReturnType<ServiceOrderExecutionRepository['recordEvidence']>>,
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ) {
    if (result.outcome === 'idempotent') {
      return {
        evidence: toExecutionEvidenceResponse(result.payload.evidence as ExecutionEvidenceRow),
        rowVersion: null,
      };
    }
    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'invalid_state') {
      throw this.invalidState();
    }
    await this.audit(actor, SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionRecord, serviceOrderId, {
      evidenceId: result.evidence.id,
    });
    return { evidence: toExecutionEvidenceResponse(result.evidence), rowVersion: result.rowVersion };
  }

  private async mapOccurrenceResult(
    result: Awaited<ReturnType<ServiceOrderExecutionRepository['recordOccurrence']>>,
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ) {
    if (result.outcome === 'idempotent') {
      return {
        occurrence: toExecutionOccurrenceResponse(result.payload.occurrence as ExecutionOccurrenceRow),
        rowVersion: null,
      };
    }
    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'invalid_state') {
      throw this.invalidState();
    }
    await this.audit(actor, SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionRecord, serviceOrderId, {
      occurrenceId: result.occurrence.id,
    });
    return { occurrence: toExecutionOccurrenceResponse(result.occurrence), rowVersion: result.rowVersion };
  }

  private async requireServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    const row = await this.serviceOrdersRepository.findById(serviceOrderId);
    if (!row) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, action, row);
    return row;
  }

  private async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    row: ServiceOrderRow,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        context: toResourceContextFromServiceOrder(row),
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === row.unit_id) {
        return true;
      }
      if (row.client_id && grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === row.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }
  }

  private async audit(
    actor: IdentityAuthzContext,
    action: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
    serviceOrderId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata,
    });
  }

  private assertValidServiceOrderId(serviceOrderId: string): void {
    try {
      assertUuid(serviceOrderId, 'serviceOrderId');
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private validationFailed(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.BAD_REQUEST,
      SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  private denied(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.FORBIDDEN,
      SERVICE_ORDERS_ERROR_CODES.DENIED,
      'Access denied.',
    );
  }

  private notFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.NOT_FOUND,
      'Service order not found.',
    );
  }

  private invalidState(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.INVALID_STATE,
      'Service order is not in a valid state for this operation.',
    );
  }

  private versionConflict(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT,
      'Service order was modified by another request.',
    );
  }

  private mapExecutionError(error: ServiceOrderExecutionError): ServiceOrdersHttpException {
    switch (error.code) {
      case 'CLIENT_NOT_FOUND':
        return new ServiceOrdersHttpException(
          HttpStatus.NOT_FOUND,
          SERVICE_ORDERS_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client not found.',
        );
      case 'CLIENT_INACTIVE':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.CLIENT_INACTIVE,
          'Client must be active for execution.',
        );
      case 'MINIMUM_RESOURCES_NOT_PLANNED':
      case 'MINIMUM_LABOR_NOT_PLANNED':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.MINIMUM_RESOURCES_NOT_MET,
          'Minimum planned resources are not met.',
        );
      case 'REQUIRED_EVIDENCE_MISSING':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.REQUIRED_EVIDENCE_MISSING,
          'Required execution evidence is missing.',
        );
      case 'EVIDENCE_KIND_NOT_RECOGNIZED':
        return new ServiceOrdersHttpException(
          HttpStatus.BAD_REQUEST,
          SERVICE_ORDERS_ERROR_CODES.EVIDENCE_KIND_NOT_RECOGNIZED,
          'Evidence kind is not recognized.',
        );
      case 'EVIDENCE_KIND_NOT_REQUIRED':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.EVIDENCE_KIND_NOT_REQUIRED,
          'Evidence kind is not required by the service snapshot.',
        );
      case 'UNIT_NOT_ALLOWED':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.UNIT_NOT_ALLOWED,
          'Unit is not allowed for this service.',
        );
      case 'SERVICE_SNAPSHOT_REQUIRED':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.SERVICE_REQUIRED,
          'Service snapshot is required.',
        );
      default:
        return this.invalidState();
    }
  }
}
