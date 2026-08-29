export type ServiceRequestConversionInput = {
  serviceRequestId: string;
  rowVersion: number;
  actorIdentityId: string;
};

export type ServiceRequestConversionResult =
  | { outcome: 'converted'; serviceOrderId: string }
  | { outcome: 'not_ready'; reasonCode: string };

/**
 * Port for Prompt 50 — conversion must create a real ServiceOrder in the same transaction.
 */
export interface ServiceRequestConversionPort {
  convert(input: ServiceRequestConversionInput): Promise<ServiceRequestConversionResult>;
}

export const SERVICE_REQUEST_CONVERSION_PORT = Symbol('SERVICE_REQUEST_CONVERSION_PORT');

export const SERVICE_REQUEST_CONVERSION_NOT_READY = 'SERVICE_ORDER_DOMAIN_NOT_READY' as const;

export class NotReadyServiceRequestConversionPort implements ServiceRequestConversionPort {
  async convert(): Promise<ServiceRequestConversionResult> {
    return { outcome: 'not_ready', reasonCode: SERVICE_REQUEST_CONVERSION_NOT_READY };
  }
}
