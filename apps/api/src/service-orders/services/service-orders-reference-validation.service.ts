import { Injectable } from '@nestjs/common';
import { ServiceOrdersRepository } from '../repositories/service-orders.repository';
import {
  serviceOrdersClientInactive,
  serviceOrdersClientNotFound,
  serviceOrdersUnitNotRegistered,
} from './service-orders-access.errors';

@Injectable()
export class ServiceOrdersReferenceValidationService {
  constructor(private readonly repository: ServiceOrdersRepository) {}

  async assertUnitRegistered(unitId: string): Promise<void> {
    const registered = await this.repository.isUnitRegistered(unitId);
    if (!registered) {
      throw serviceOrdersUnitNotRegistered();
    }
  }

  async assertClientExists(clientId: string): Promise<void> {
    const client = await this.repository.findClientById(clientId);
    if (!client) {
      throw serviceOrdersClientNotFound();
    }
  }

  async assertClientActive(clientId: string): Promise<void> {
    const client = await this.repository.findClientById(clientId);
    if (!client) {
      throw serviceOrdersClientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw serviceOrdersClientInactive('Client must be active.');
    }
  }
}
