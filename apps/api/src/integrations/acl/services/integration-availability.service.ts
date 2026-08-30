import { Injectable } from '@nestjs/common';
import {
  loadIntegrationCapabilitySnapshot,
  type IntegrationCapability,
  type IntegrationCapabilitySnapshot,
} from '../config/integration-capability.config';

@Injectable()
export class IntegrationAvailabilityService {
  snapshot(): IntegrationCapabilitySnapshot {
    return loadIntegrationCapabilitySnapshot();
  }

  erp(): IntegrationCapability {
    return loadIntegrationCapabilitySnapshot().erp;
  }

  tracking(): IntegrationCapability {
    return loadIntegrationCapabilitySnapshot().tracking;
  }
}
