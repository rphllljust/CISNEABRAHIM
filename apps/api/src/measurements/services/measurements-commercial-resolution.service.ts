import { Injectable } from '@nestjs/common';
import {
  loadProposalMeasurementPricing,
  loadPurchaseOrderMeasurementPricing,
} from '../../commercial/application/measurement-commercial-pricing';
import { normalizeMoneyAmount } from '../../commercial/domain/money';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { ServiceOrderServiceSnapshot } from '../../service-orders/domain/service-order-snapshot';
import type { ServiceOrderRow } from '../../service-orders/repositories/service-orders.repository.types';
import {
  MeasurementError,
  type CommercialPricingLineSnapshot,
  type MeasurementCommercialReferenceSnapshot,
} from '../domain/measurement';
import { buildMeasurementCommercialLinkage } from '../domain/measurement-invariants';
import { computeLineAmount } from '../domain/measurement-quantity';
import { MeasurementsRepository } from '../repositories/measurements.repository';
import { mapMeasurementDomainError } from './measurements-access.errors';

@Injectable()
export class MeasurementsCommercialResolutionService {
  constructor(
    private readonly measurementsRepository: MeasurementsRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async buildCommercialSnapshot(
    order: ServiceOrderRow,
  ): Promise<MeasurementCommercialReferenceSnapshot> {
    const serviceSnapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw mapMeasurementDomainError(new MeasurementError('COMMERCIAL_REFERENCE_MISSING'));
    }
    const pool = connection.pool;

    let pricingLines: CommercialPricingLineSnapshot[] | null = null;
    let source: MeasurementCommercialReferenceSnapshot['source'] = 'SERVICE_CATALOG';

    if (order.proposal_id) {
      const proposalPricing = await loadProposalMeasurementPricing(
        pool,
        order.proposal_id,
        serviceSnapshot.serviceDefinitionVersionId,
      );
      if (proposalPricing && proposalPricing.length > 0) {
        pricingLines = proposalPricing;
        source = 'PROPOSAL';
      }
    }

    if (!pricingLines && order.purchase_order_id) {
      const purchaseOrderPricing = await loadPurchaseOrderMeasurementPricing(
        pool,
        order.purchase_order_id,
        serviceSnapshot.serviceDefinitionVersionId,
      );
      if (purchaseOrderPricing && purchaseOrderPricing.length > 0) {
        pricingLines = purchaseOrderPricing;
        source = 'PURCHASE_ORDER';
      }
    }

    if (!pricingLines) {
      const catalogRows = await this.measurementsRepository.loadPricingModels(
        serviceSnapshot.serviceDefinitionVersionId,
      );
      if (catalogRows.length === 0) {
        throw mapMeasurementDomainError(new MeasurementError('COMMERCIAL_REFERENCE_MISSING'));
      }
      pricingLines = catalogRows.map((row) => ({
        modelCode: row.model_code,
        salePrice: row.sale_price,
        internalCost: row.internal_cost,
        currencyCode: row.currency_code,
      }));
      source = 'SERVICE_CATALOG';
    }

    return {
      source,
      serviceDefinitionVersionId: serviceSnapshot.serviceDefinitionVersionId,
      capturedAt: new Date().toISOString(),
      proposalId: order.proposal_id,
      purchaseOrderId: order.purchase_order_id,
      pricingLines,
      ...buildMeasurementCommercialLinkage(order),
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

    const serviceSnapshot = order.service_snapshot as unknown as ServiceOrderServiceSnapshot;

    return entries.map((entry) => {
      const primaryPricing = this.resolvePricingLine(commercialSnapshot.pricingLines, entry.quantity_unit_code);
      const actualQuantity = entry.quantity_value;
      const measuredQuantity = actualQuantity;
      const unitPrice =
        primaryPricing.modelCode === 'PER_UNIT' ||
        primaryPricing.modelCode === 'UNIT_PRICE' ||
        primaryPricing.modelCode === 'PER_KM' ||
        primaryPricing.modelCode === 'PER_M3' ||
        primaryPricing.modelCode === 'PER_TRIP' ||
        primaryPricing.modelCode === 'PROPOSAL_ITEM' ||
        primaryPricing.modelCode === 'PURCHASE_ORDER_ITEM'
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

  private resolvePricingLine(
    pricingLines: CommercialPricingLineSnapshot[],
    unitCode: string,
  ): CommercialPricingLineSnapshot {
    const withUnit = pricingLines.find((line) => line.unitCode === unitCode);
    return withUnit ?? pricingLines[0]!;
  }
}
