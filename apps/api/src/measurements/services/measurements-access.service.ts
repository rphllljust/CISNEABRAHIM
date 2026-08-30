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
import { normalizeMoneyAmount } from '../../commercial/domain/money';
import { SERVICE_ORDER_STATUSES } from '../../service-orders/domain/service-order';
import type { ServiceOrderServiceSnapshot } from '../../service-orders/domain/service-order-snapshot';
import { ServiceOrdersRepository } from '../../service-orders/repositories/service-orders.repository';
import type { ServiceOrderRow } from '../../service-orders/repositories/service-orders.repository.types';
import {
  MEASUREMENT_COMMANDS,
  MEASUREMENT_STATUSES,
  MeasurementError,
  type CommercialPricingLineSnapshot,
  type MeasurementCommercialReferenceSnapshot,
} from '../domain/measurement';
import { computeLineAmount } from '../domain/measurement-quantity';
import { assertTransition, MeasurementStateError } from '../domain/measurement.state-machine';
import {
  assertApprovePreconditions,
  assertSubmitPreconditions,
  validateAuthorizeMeasurementAdjustmentInput,
  validateAdjustmentQuantity,
  validateItemMeasuredQuantity,
  validateRejectMeasurementInput,
  validateRowVersionCommandInput,
  validateUpdateMeasurementItemInput,
  type AuthorizeMeasurementAdjustmentInput,
  type RejectMeasurementInput,
  type RowVersionCommandInput,
  type UpdateMeasurementItemInput,
} from '../domain/measurement.validation';
import { MEASUREMENTS_ERROR_CODES } from '../errors/measurements-error-codes';
import { MeasurementsHttpException } from '../errors/measurements-http.exception';
import { MeasurementsRepository } from '../repositories/measurements.repository';
import type { MeasurementRow } from '../repositories/measurements.repository.types';
import {
  toMeasurementDetailResponse,
  type MeasurementDetailResponse,
} from '../serializers/measurements-response.serializer';

@Injectable()
export class MeasurementsAccessService {
  constructor(
    private readonly measurementsRepository: MeasurementsRepository,
    private readonly serviceOrdersRepository: ServiceOrdersRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
    private readonly domainEventsRecorder: DomainEventsRecorderService,
  ) {}

  async getByServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ): Promise<MeasurementDetailResponse | null> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.MeasurementsMeasurementRead);
    const measurement = await this.measurementsRepository.findByServiceOrderId(order.id);
    if (!measurement) {
      return null;
    }
    return this.loadDetail(measurement);
  }

  async getById(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
  ): Promise<MeasurementDetailResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.MeasurementsMeasurementRead);
    const measurement = await this.requireMeasurementForOrder(measurementId, order.id);
    return this.loadDetail(measurement);
  }

  async create(actor: IdentityAuthzContext, serviceOrderId: string): Promise<MeasurementDetailResponse> {
    const order = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.MeasurementsMeasurementCreate,
    );

    if (order.status !== SERVICE_ORDER_STATUSES.Completed) {
      throw this.mapMeasurementError(new MeasurementError('SERVICE_ORDER_NOT_COMPLETED'));
    }

    const commercialSnapshot = await this.buildCommercialSnapshot(order);
    const items = await this.buildItemsFromExecution(order, commercialSnapshot);

    const result = await this.measurementsRepository.createMeasurement({
      serviceOrderId: order.id,
      unitId: order.unit_id,
      actorIdentityId: actor.identityId,
      commercialReferenceSnapshot: commercialSnapshot,
      items,
    });

    if (result.outcome === 'already_exists') {
      throw new MeasurementsHttpException(
        HttpStatus.CONFLICT,
        MEASUREMENTS_ERROR_CODES.MEASUREMENT_ALREADY_EXISTS,
        'An active measurement already exists for this service order.',
      );
    }

    await this.audit(actor, SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementCreate, order.id, {
      measurementId: result.measurement.id,
    });

    return this.loadDetail(result.measurement);
  }

  async regenerate(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: RowVersionCommandInput,
  ): Promise<MeasurementDetailResponse> {
    const order = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.MeasurementsMeasurementUpdate,
    );
    const measurement = await this.requireMeasurementForOrder(measurementId, order.id);
    let validated: RowVersionCommandInput;
    try {
      validated = validateRowVersionCommandInput(input);
    } catch {
      throw this.validationFailed();
    }

    const commercialSnapshot = measurement.commercial_reference_snapshot as MeasurementCommercialReferenceSnapshot;
    const items = await this.buildItemsFromExecution(order, commercialSnapshot);

    const result = await this.measurementsRepository.regenerateItems({
      measurementId: measurement.id,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      items,
    });

    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'not_editable') {
      throw this.notEditable();
    }

    await this.audit(actor, SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementUpdate, order.id, {
      measurementId,
      action: 'regenerate',
    });

    const refreshed = await this.measurementsRepository.findById(measurementId);
    return this.loadDetail(refreshed!);
  }

  async updateItem(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    itemId: string,
    input: UpdateMeasurementItemInput,
  ) {
    const order = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.MeasurementsMeasurementUpdate,
    );
    const measurement = await this.requireMeasurementForOrder(measurementId, order.id);
    const items = await this.measurementsRepository.listItems(measurement.id);
    const item = items.find((row) => row.id === itemId);
    if (!item) {
      throw this.itemNotFound();
    }

    let validated: UpdateMeasurementItemInput;
    try {
      validated = validateUpdateMeasurementItemInput(input);
    } catch {
      throw this.validationFailed();
    }

    const authorizedAdjustmentTotal = await this.measurementsRepository.sumAdjustmentsForItem(itemId);
    const unit = await this.measurementsRepository.loadUnitOfMeasure(item.unit_code);
    if (!unit) {
      throw this.mapMeasurementError(new MeasurementError('UNIT_NOT_ALLOWED'));
    }

    const serviceSnapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
    let measuredQuantity: string;
    try {
      measuredQuantity = validateItemMeasuredQuantity({
        measuredQuantity: validated.measuredQuantity,
        actualQuantity: item.actual_quantity,
        authorizedAdjustmentTotal,
        unitCode: item.unit_code,
        unitDecimalScale: unit.decimal_scale,
        serviceSnapshot,
      });
    } catch (error) {
      if (error instanceof MeasurementError) {
        throw this.mapMeasurementError(error);
      }
      throw error;
    }

    const pricingSnapshot = item.pricing_line_snapshot as CommercialPricingLineSnapshot;
    const lineAmount = computeLineAmount({
      modelCode: pricingSnapshot.modelCode,
      measuredQuantity,
      unitPrice: item.unit_price,
      salePrice: pricingSnapshot.salePrice,
    });

    const result = await this.measurementsRepository.updateItemMeasuredQuantity({
      measurementId: measurement.id,
      itemId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      measuredQuantity,
      lineAmount: lineAmount ? normalizeMoneyAmount(lineAmount) : null,
    });

    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'not_editable') {
      throw this.notEditable();
    }
    if (result.outcome === 'item_not_found') {
      throw this.itemNotFound();
    }

    await this.audit(actor, SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementUpdate, order.id, {
      measurementId,
      itemId,
    });

    const refreshed = await this.measurementsRepository.findById(measurementId);
    return this.loadDetail(refreshed!);
  }

  async authorizeAdjustment(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: AuthorizeMeasurementAdjustmentInput,
  ) {
    const order = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.MeasurementsMeasurementUpdate,
    );
    const measurement = await this.requireMeasurementForOrder(measurementId, order.id);

    let validated: AuthorizeMeasurementAdjustmentInput;
    try {
      validated = validateAuthorizeMeasurementAdjustmentInput(input);
    } catch {
      throw this.validationFailed();
    }

    const items = await this.measurementsRepository.listItems(measurement.id);
    const item = items.find((row) => row.id === validated.measurementItemId);
    if (!item) {
      throw this.itemNotFound();
    }

    const unit = await this.measurementsRepository.loadUnitOfMeasure(item.unit_code);
    if (!unit) {
      throw this.mapMeasurementError(new MeasurementError('UNIT_NOT_ALLOWED'));
    }

    let adjustmentQuantity: string;
    try {
      adjustmentQuantity = validateAdjustmentQuantity({
        adjustmentQuantity: validated.adjustmentQuantity,
        unitCode: item.unit_code,
        itemUnitCode: item.unit_code,
        unitDecimalScale: unit.decimal_scale,
      });
    } catch (error) {
      if (error instanceof MeasurementError) {
        throw this.mapMeasurementError(error);
      }
      throw error;
    }

    const result = await this.measurementsRepository.authorizeAdjustment({
      measurementId: measurement.id,
      itemId: item.id,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      adjustmentQuantity,
      unitCode: item.unit_code,
      reason: validated.reason,
    });

    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'not_editable') {
      throw this.notEditable();
    }
    if (result.outcome === 'item_not_found') {
      throw this.itemNotFound();
    }

    await this.audit(actor, SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementUpdate, order.id, {
      measurementId,
      adjustmentId: result.adjustment.id,
    });

    const refreshed = await this.measurementsRepository.findById(measurementId);
    return this.loadDetail(refreshed!);
  }

  async submit(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: RowVersionCommandInput,
  ) {
    return this.runTransition(
      actor,
      serviceOrderId,
      measurementId,
      input,
      'submit',
      AUTHZ_ACTIONS.MeasurementsMeasurementSubmit,
      SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementSubmit,
      async (order, measurement) => {
        const items = await this.measurementsRepository.listItems(measurement.id);
        assertSubmitPreconditions({
          serviceOrderStatus: order.status,
          commercialSnapshot: measurement.commercial_reference_snapshot,
          itemCount: items.length,
        });
      },
    );
  }

  async startReview(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: RowVersionCommandInput,
  ) {
    return this.runTransition(
      actor,
      serviceOrderId,
      measurementId,
      input,
      'startReview',
      AUTHZ_ACTIONS.MeasurementsMeasurementReview,
      SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementReview,
    );
  }

  async approve(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: RowVersionCommandInput,
  ) {
    return this.runTransition(
      actor,
      serviceOrderId,
      measurementId,
      input,
      'approve',
      AUTHZ_ACTIONS.MeasurementsMeasurementApprove,
      SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementApprove,
      async (_order, measurement) => {
        const items = await this.measurementsRepository.listItems(measurement.id);
        assertApprovePreconditions({
          commercialSnapshot: measurement.commercial_reference_snapshot,
          itemCount: items.length,
          submittedByIdentityId: measurement.submitted_by_identity_id,
          decidedByIdentityId: actor.identityId,
        });
      },
    );
  }

  async reject(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: RejectMeasurementInput,
  ) {
    let validated: RejectMeasurementInput;
    try {
      validated = validateRejectMeasurementInput(input);
    } catch {
      throw this.validationFailed();
    }

    return this.runTransition(
      actor,
      serviceOrderId,
      measurementId,
      validated,
      'reject',
      AUTHZ_ACTIONS.MeasurementsMeasurementReject,
      SECURITY_AUDIT_ACTIONS.MeasurementsMeasurementReject,
      undefined,
      validated.rejectionReason,
    );
  }

  private async runTransition(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    measurementId: string,
    input: RowVersionCommandInput,
    transition: 'submit' | 'startReview' | 'approve' | 'reject',
    action: AuthzAction,
    auditAction: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
    precondition?: (order: ServiceOrderRow, measurement: MeasurementRow) => Promise<void> | void,
    rejectionReason?: string,
  ): Promise<MeasurementDetailResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, action);
    const measurement = await this.requireMeasurementForOrder(measurementId, order.id);

    let validated: RowVersionCommandInput;
    try {
      validated = validateRowVersionCommandInput(input);
    } catch {
      throw this.validationFailed();
    }

    const commandName =
      transition === 'submit'
        ? MEASUREMENT_COMMANDS.Submit
        : transition === 'startReview'
          ? MEASUREMENT_COMMANDS.StartReview
          : transition === 'approve'
            ? MEASUREMENT_COMMANDS.Approve
            : MEASUREMENT_COMMANDS.Reject;

    if (validated.idempotencyKey) {
      const existing = await this.measurementsRepository.findIdempotency(
        measurementId,
        commandName,
        validated.idempotencyKey,
      );
      if (existing) {
        const refreshed = await this.measurementsRepository.findById(measurementId);
        return this.loadDetail(refreshed!);
      }
    }

    let nextStatus: string;
    try {
      nextStatus = assertTransition(
        measurement.status as (typeof MEASUREMENT_STATUSES)[keyof typeof MEASUREMENT_STATUSES],
        transition,
      );
    } catch (error) {
      if (error instanceof MeasurementStateError) {
        throw this.invalidState();
      }
      throw error;
    }

    if (precondition) {
      try {
        await precondition(order, measurement);
      } catch (error) {
        if (error instanceof MeasurementError) {
          throw this.mapMeasurementError(error);
        }
        throw error;
      }
    }

    const result = await this.measurementsRepository.transitionMeasurement({
      measurementId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      currentStatus: measurement.status,
      nextStatus,
      transition,
      commandName,
      idempotencyKey: validated.idempotencyKey,
      rejectionReason,
    });

    if (result.outcome === 'version_conflict') {
      throw this.versionConflict();
    }
    if (result.outcome === 'invalid_state') {
      throw this.invalidState();
    }

    await this.audit(actor, auditAction, order.id, { measurementId, rowVersion: result.rowVersion });

    const refreshed = await this.measurementsRepository.findById(measurementId);
    if (refreshed) {
      if (transition === 'submit' && refreshed.submitted_at) {
        await this.domainEventsRecorder.recordMeasurementSubmitted({
          measurementId: refreshed.id,
          serviceOrderId: order.id,
          unitId: refreshed.unit_id,
          submittedAt: refreshed.submitted_at,
        });
      }
      if (transition === 'approve' && refreshed.decided_at) {
        await this.domainEventsRecorder.recordMeasurementApproved({
          measurementId: refreshed.id,
          serviceOrderId: order.id,
          unitId: refreshed.unit_id,
          approvedAt: refreshed.decided_at,
        });
      }
    }

    return this.loadDetail(refreshed!);
  }

  private async buildCommercialSnapshot(
    order: ServiceOrderRow,
  ): Promise<MeasurementCommercialReferenceSnapshot> {
    const serviceSnapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
    const pricingRows = await this.measurementsRepository.loadPricingModels(
      serviceSnapshot.serviceDefinitionVersionId,
    );
    if (pricingRows.length === 0) {
      throw this.mapMeasurementError(new MeasurementError('COMMERCIAL_REFERENCE_MISSING'));
    }

    const source =
      order.proposal_id !== null
        ? 'PROPOSAL'
        : order.purchase_order_id !== null
          ? 'PURCHASE_ORDER'
          : 'SERVICE_CATALOG';

    return {
      source,
      serviceDefinitionVersionId: serviceSnapshot.serviceDefinitionVersionId,
      capturedAt: new Date().toISOString(),
      proposalId: order.proposal_id,
      purchaseOrderId: order.purchase_order_id,
      pricingLines: pricingRows.map((row) => ({
        modelCode: row.model_code,
        salePrice: row.sale_price,
        internalCost: row.internal_cost,
        currencyCode: row.currency_code,
      })),
    };
  }

  private async buildItemsFromExecution(
    order: ServiceOrderRow,
    commercialSnapshot: MeasurementCommercialReferenceSnapshot,
  ) {
    const entries = await this.measurementsRepository.listExecutionQuantityEntries(order.id);
    if (entries.length === 0) {
      throw this.mapMeasurementError(new MeasurementError('MEASUREMENT_ITEMS_REQUIRED'));
    }

    const primaryPricing = commercialSnapshot.pricingLines[0]!;
    const serviceSnapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;

    return entries.map((entry) => {
      const actualQuantity = entry.quantity_value;
      const measuredQuantity = actualQuantity;
      const unitPrice =
        primaryPricing.modelCode === 'PER_UNIT' ||
        primaryPricing.modelCode === 'UNIT_PRICE' ||
        primaryPricing.modelCode === 'PER_KM' ||
        primaryPricing.modelCode === 'PER_M3' ||
        primaryPricing.modelCode === 'PER_TRIP'
          ? primaryPricing.salePrice
          : null;
      const lineAmount = computeLineAmount({
        modelCode: primaryPricing.modelCode,
        measuredQuantity,
        unitPrice,
        salePrice: primaryPricing.salePrice,
      });

      if (!serviceSnapshot.allowedUnits.some((unit) => unit.unitCode === entry.quantity_unit_code)) {
        throw this.mapMeasurementError(new MeasurementError('UNIT_NOT_ALLOWED'));
      }

      return {
        sourceExecutionEntryId: entry.id,
        unitCode: entry.quantity_unit_code,
        actualQuantity,
        measuredQuantity,
        unitPrice: unitPrice ? normalizeMoneyAmount(unitPrice) : null,
        lineAmount: lineAmount ? normalizeMoneyAmount(lineAmount) : null,
        pricingLineSnapshot: primaryPricing,
      };
    });
  }

  private async loadDetail(measurement: MeasurementRow): Promise<MeasurementDetailResponse> {
    const [items, adjustments, historyEvents] = await Promise.all([
      this.measurementsRepository.listItems(measurement.id),
      this.measurementsRepository.listAdjustments(measurement.id),
      this.measurementsRepository.listHistoryEvents(measurement.id),
    ]);
    return toMeasurementDetailResponse(measurement, items, adjustments, historyEvents);
  }

  private async requireMeasurementForOrder(
    measurementId: string,
    serviceOrderId: string,
  ): Promise<MeasurementRow> {
    this.assertValidUuid(measurementId, 'measurementId');
    const measurement = await this.measurementsRepository.findById(measurementId);
    if (!measurement || measurement.service_order_id !== serviceOrderId) {
      throw this.notFound();
    }
    return measurement;
  }

  private async requireServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    const row = await this.serviceOrdersRepository.findById(serviceOrderId);
    if (!row) {
      throw this.serviceOrderNotFound();
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

  private assertValidUuid(value: string, field: string): void {
    try {
      assertUuid(value, field);
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private mapMeasurementError(error: MeasurementError): MeasurementsHttpException {
    const codeMap: Record<string, (typeof MEASUREMENTS_ERROR_CODES)[keyof typeof MEASUREMENTS_ERROR_CODES]> = {
      SERVICE_ORDER_NOT_COMPLETED: MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_COMPLETED,
      COMMERCIAL_REFERENCE_MISSING: MEASUREMENTS_ERROR_CODES.COMMERCIAL_REFERENCE_MISSING,
      MEASUREMENT_ITEMS_REQUIRED: MEASUREMENTS_ERROR_CODES.MEASUREMENT_ITEMS_REQUIRED,
      UNIT_NOT_ALLOWED: MEASUREMENTS_ERROR_CODES.UNIT_NOT_ALLOWED,
      UNIT_MISMATCH: MEASUREMENTS_ERROR_CODES.UNIT_MISMATCH,
      INVALID_MEASURED_QUANTITY: MEASUREMENTS_ERROR_CODES.INVALID_MEASURED_QUANTITY,
      QUANTITY_PRECISION_EXCEEDED: MEASUREMENTS_ERROR_CODES.QUANTITY_PRECISION_EXCEEDED,
      MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED: MEASUREMENTS_ERROR_CODES.MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED,
      INVALID_ADJUSTMENT_QUANTITY: MEASUREMENTS_ERROR_CODES.INVALID_ADJUSTMENT_QUANTITY,
      SEPARATION_OF_DUTIES_VIOLATION: MEASUREMENTS_ERROR_CODES.SEPARATION_OF_DUTIES_VIOLATION,
    };
    const code = codeMap[error.code] ?? MEASUREMENTS_ERROR_CODES.VALIDATION_FAILED;
    const status =
      error.code === 'MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED'
        ? HttpStatus.CONFLICT
        : HttpStatus.BAD_REQUEST;
    return new MeasurementsHttpException(status, code, error.code);
  }

  private validationFailed(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.BAD_REQUEST,
      MEASUREMENTS_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  private denied(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.FORBIDDEN,
      MEASUREMENTS_ERROR_CODES.DENIED,
      'Access denied.',
    );
  }

  private notFound(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.NOT_FOUND,
      MEASUREMENTS_ERROR_CODES.NOT_FOUND,
      'Measurement not found.',
    );
  }

  private serviceOrderNotFound(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.NOT_FOUND,
      MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
      'Service order not found.',
    );
  }

  private itemNotFound(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.NOT_FOUND,
      MEASUREMENTS_ERROR_CODES.ITEM_NOT_FOUND,
      'Measurement item not found.',
    );
  }

  private invalidState(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.CONFLICT,
      MEASUREMENTS_ERROR_CODES.INVALID_STATE,
      'Measurement is not in a valid state for this operation.',
    );
  }

  private versionConflict(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.CONFLICT,
      MEASUREMENTS_ERROR_CODES.VERSION_CONFLICT,
      'Measurement was updated by another request.',
    );
  }

  private notEditable(): MeasurementsHttpException {
    return new MeasurementsHttpException(
      HttpStatus.CONFLICT,
      MEASUREMENTS_ERROR_CODES.NOT_EDITABLE,
      'Measurement is not editable.',
    );
  }
}
