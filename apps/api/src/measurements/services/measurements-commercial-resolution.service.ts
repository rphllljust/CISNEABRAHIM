import { Injectable } from '@nestjs/common';
import { normalizeMoneyAmount } from '../../commercial/domain/money';
import type { ServiceOrderServiceSnapshot } from '../../service-orders/domain/service-order-snapshot';
import type { ServiceOrderRow } from '../../service-orders/repositories/service-orders.repository.types';
import {
  MeasurementError,
  type MeasurementCommercialReferenceSnapshot,
} from '../domain/measurement';
import { computeLineAmount } from '../domain/measurement-quantity';
import { MeasurementsRepository } from '../repositories/measurements.repository';
import { mapMeasurementDomainError } from './measurements-access.errors';

@Injectable()
export class MeasurementsCommercialResolutionService {
  constructor(private readonly measurementsRepository: MeasurementsRepository) {}

  async buildCommercialSnapshot(
    order: ServiceOrderRow,
  ): Promise<MeasurementCommercialReferenceSnapshot> {
    const serviceSnapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
    const pricingRows = await this.measurementsRepository.loadPricingModels(
      serviceSnapshot.serviceDefinitionVersionId,
    );
    if (pricingRows.length === 0) {
      throw mapMeasurementDomainError(new MeasurementError('COMMERCIAL_REFERENCE_MISSING'));
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

  async buildItemsFromExecution(
    order: ServiceOrderRow,
    commercialSnapshot: MeasurementCommercialReferenceSnapshot,
  ) {
    const entries = await this.measurementsRepository.listExecutionQuantityEntries(order.id);
    if (entries.length === 0) {
      throw mapMeasurementDomainError(new MeasurementError('MEASUREMENT_ITEMS_REQUIRED'));
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
        throw mapMeasurementDomainError(new MeasurementError('UNIT_NOT_ALLOWED'));
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
}
