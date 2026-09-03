import { listServiceOrders } from '../../service-orders/api/service-orders-api';

export const TRANSPORT_SERVICE_ARCHETYPE = 'TRANSPORT';

export async function listTransportServiceOrders(
  params: Omit<Parameters<typeof listServiceOrders>[0], 'archetype'> = {},
  signal?: AbortSignal,
) {
  return listServiceOrders({ ...params, archetype: TRANSPORT_SERVICE_ARCHETYPE }, signal);
}
