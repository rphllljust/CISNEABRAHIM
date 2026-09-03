import { listServiceOrders } from '../../service-orders/api/service-orders-api';

export const RENTAL_SERVICE_ARCHETYPE = 'RENTAL';

export async function listRentalServiceOrders(
  params: Omit<Parameters<typeof listServiceOrders>[0], 'archetype'> = {},
  signal?: AbortSignal,
) {
  return listServiceOrders({ ...params, archetype: RENTAL_SERVICE_ARCHETYPE }, signal);
}