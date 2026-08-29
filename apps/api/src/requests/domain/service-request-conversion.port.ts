export type ServiceRequestConversionInput = {
  serviceRequestId: string;
  rowVersion: number;
  actorIdentityId: string;
};

export type ServiceRequestConversionResult =
  | { outcome: 'converted'; serviceOrderId: string }
  | { outcome: 'version_conflict' }
  | { outcome: 'invalid_state' }
  | { outcome: 'service_not_found' }
  | { outcome: 'already_converted'; serviceOrderId: string };

/**
 * Port for atomic ServiceRequest → ServiceOrder conversion (Prompt 50).
 */
export interface ServiceRequestConversionPort {
  convert(input: ServiceRequestConversionInput): Promise<ServiceRequestConversionResult>;
}

export const SERVICE_REQUEST_CONVERSION_PORT = Symbol('SERVICE_REQUEST_CONVERSION_PORT');
