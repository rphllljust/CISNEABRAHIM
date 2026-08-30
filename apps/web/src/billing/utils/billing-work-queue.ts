import { getBillingRecord } from '../api/billing-api';
import { getMeasurement } from '../../service-orders/api/measurement-api';
import { getServiceOrder, listServiceOrders } from '../../service-orders/api/service-orders-api';
import { SERVICE_ORDER_STATUSES } from '../../service-orders/types/service-order.types';
import type { BillingWorkQueueItem } from '../types/billing.types';
import { buildWorkQueueItem, suggestDeclaredPaymentTerms } from './billing-process';

const DASHBOARD_PAGE_SIZE = 20;

export async function loadBillingWorkQueue(signal?: AbortSignal): Promise<BillingWorkQueueItem[]> {
  const list = await listServiceOrders(
    {
      status: SERVICE_ORDER_STATUSES.Completed,
      limit: DASHBOARD_PAGE_SIZE,
      offset: 0,
    },
    signal,
  );

  const items = await Promise.all(
    list.items.map(async (summary) => {
      try {
        const [order, measurement, billing] = await Promise.all([
          getServiceOrder(summary.id, signal),
          getMeasurement(summary.id, signal),
          getBillingRecord(summary.id, signal),
        ]);
        const declaredTerms = billing?.paymentTerms ?? suggestDeclaredPaymentTerms(order);
        return buildWorkQueueItem(order, measurement, billing, declaredTerms);
      } catch {
        return null;
      }
    }),
  );

  return items.filter((item): item is BillingWorkQueueItem => item !== null);
}
