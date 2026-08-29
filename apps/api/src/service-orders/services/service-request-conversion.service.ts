import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type {
  ServiceRequestConversionInput,
  ServiceRequestConversionPort,
  ServiceRequestConversionResult,
} from '../../requests/domain/service-request-conversion.port';
import {
  buildServiceOrderClientSnapshot,
  buildServiceOrderProposalSnapshot,
  buildServiceOrderPurchaseOrderSnapshot,
  buildServiceOrderServiceSnapshot,
} from '../domain/service-order-snapshot';
import { ServiceOrdersRepository } from '../repositories/service-orders.repository';

@Injectable()
export class ServiceRequestConversionService implements ServiceRequestConversionPort {
  constructor(private readonly repository: ServiceOrdersRepository) {}

  async convert(input: ServiceRequestConversionInput): Promise<ServiceRequestConversionResult> {
    const snapshots = await this.buildSnapshots(input.serviceRequestId);
    if (!snapshots) {
      return { outcome: 'service_not_found' };
    }

    const result = await this.repository.convertFromServiceRequest({
      serviceRequestId: input.serviceRequestId,
      rowVersion: input.rowVersion,
      actorIdentityId: input.actorIdentityId,
      internalCode: this.generateInternalCode(),
      orderNumber: this.generateOrderNumber(),
      clientSnapshot: snapshots.clientSnapshot,
      serviceSnapshot: snapshots.serviceSnapshot,
      proposalSnapshot: snapshots.proposalSnapshot,
      purchaseOrderSnapshot: snapshots.purchaseOrderSnapshot,
      rcNumber: snapshots.rcNumber,
    });

    switch (result.outcome) {
      case 'converted':
        return { outcome: 'converted', serviceOrderId: result.serviceOrder.id };
      case 'already_converted':
        return { outcome: 'already_converted', serviceOrderId: result.serviceOrderId };
      case 'invalid_state':
        return { outcome: 'invalid_state' };
      case 'version_conflict':
        return { outcome: 'version_conflict' };
      default:
        return { outcome: 'version_conflict' };
    }
  }

  private async buildSnapshots(serviceRequestId: string): Promise<{
    serviceSnapshot: Record<string, unknown>;
    clientSnapshot: Record<string, unknown> | null;
    proposalSnapshot: Record<string, unknown> | null;
    purchaseOrderSnapshot: Record<string, unknown> | null;
    rcNumber: string | null;
  } | null> {
    const request = await this.repository.findServiceRequestById(serviceRequestId);
    if (!request?.service_definition_id) {
      return null;
    }

    const source = await this.repository.findServiceSnapshotSource(
      request.service_definition_id,
      request.service_definition_version_id ?? undefined,
    );
    if (!source) {
      return null;
    }

    const parts = await this.repository.loadServiceSnapshotParts(
      source.service_definition_version_id,
    );
    const serviceSnapshot = buildServiceOrderServiceSnapshot({
      source,
      ...parts,
    });

    let clientSnapshot: Record<string, unknown> | null = null;
    if (request.client_id) {
      const client = await this.repository.findClientById(request.client_id);
      if (client) {
        clientSnapshot = buildServiceOrderClientSnapshot(client);
      }
    }

    let proposalSnapshot: Record<string, unknown> | null = null;
    if (request.proposal_id) {
      const proposal = await this.repository.findProposalById(request.proposal_id);
      if (proposal) {
        proposalSnapshot = buildServiceOrderProposalSnapshot(proposal);
      }
    }

    let purchaseOrderSnapshot: Record<string, unknown> | null = null;
    let rcNumber: string | null = null;
    if (request.purchase_order_id) {
      const purchaseOrder = await this.repository.findPurchaseOrderById(request.purchase_order_id);
      if (purchaseOrder) {
        purchaseOrderSnapshot = buildServiceOrderPurchaseOrderSnapshot(purchaseOrder);
        rcNumber = purchaseOrder.rc_number;
      }
    }

    return {
      serviceSnapshot,
      clientSnapshot,
      proposalSnapshot,
      purchaseOrderSnapshot,
      rcNumber,
    };
  }

  private generateInternalCode(): string {
    return `SO-INT-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private generateOrderNumber(): string {
    return `OS-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
