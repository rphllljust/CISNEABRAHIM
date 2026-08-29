import { vi } from 'vitest';
import { requestUrl } from './request-url';
import { createAssetsFetchMock } from './assets-fetch-mock';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
  VEHICLE_CLASSIFICATION,
  type PhysicalAsset,
} from '../assets/types/physical-asset.types';
import type { PlannedResource, ResourceAllocation } from '../service-orders/types/resource-planning.types';
import { SERVICE_ORDER_STATUSES } from '../service-orders/types/service-order.types';

export const MOCK_SERVICE_ORDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const MOCK_PLANNED_RESOURCE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const MOCK_ASSET_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MOCK_ASSET_B_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const PROBE_SERVICE_ORDER_ID = '00000000-0000-4000-8000-000000000010';
const TRUCK_TYPE_ID = '11111111-1111-4111-8111-111111111111';

export type ServiceOrdersFetchMockOptions = {
  serviceOrderListAllowed?: boolean;
  serviceOrderReadAllowed?: boolean;
  planAllowed?: boolean;
  allocateAllowed?: boolean;
  removeAllocationAllowed?: boolean;
  assetListAllowed?: boolean;
};

function orderError(code: string, status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({ code, message: 'error' }),
  } as Response;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function parseInterval(start: string, end: string): { startMs: number; endMs: number } {
  return { startMs: Date.parse(start), endMs: Date.parse(end) };
}

function intervalsOverlap(
  a: { startMs: number; endMs: number },
  b: { startMs: number; endMs: number },
): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

export function createServiceOrdersFetchMock(options: ServiceOrdersFetchMockOptions = {}) {
  const upstream = createAssetsFetchMock({ assetListAllowed: options.assetListAllowed });
  const listAllowed = options.serviceOrderListAllowed ?? true;
  const readAllowed = options.serviceOrderReadAllowed ?? true;
  const planAllowed = options.planAllowed ?? true;
  const allocateAllowed = options.allocateAllowed ?? true;
  const removeAllocationAllowed = options.removeAllocationAllowed ?? true;

  const planningAssets: PhysicalAsset[] = [
    {
      id: MOCK_ASSET_A_ID,
      assetCode: 'TRK-DEMO',
      resourceTypeId: TRUCK_TYPE_ID,
      resourceTypeCode: 'TRUCK',
      resourceTypeClassification: VEHICLE_CLASSIFICATION,
      name: 'Caminhão demo',
      lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
      allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
      unitId: 'unit-demo',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deactivatedAt: null,
      vehicle: { plate: 'DEM-0A12', chassis: 'CH-001', model: 'Volvo' },
    },
    {
      id: MOCK_ASSET_B_ID,
      assetCode: 'TRK-ALT',
      resourceTypeId: TRUCK_TYPE_ID,
      resourceTypeCode: 'TRUCK',
      resourceTypeClassification: VEHICLE_CLASSIFICATION,
      name: 'Caminhão reserva',
      lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
      allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
      unitId: 'unit-demo',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deactivatedAt: null,
      vehicle: { plate: 'ALT-0B34', chassis: 'CH-002', model: 'Mercedes' },
    },
  ];

  const planned: PlannedResource[] = [];
  const allocations: ResourceAllocation[] = [];

  function serviceOrderDetail(id: string) {
    return {
      id,
      internalCode: 'OS-INT-001',
      orderNumber: 'OS-2026-DEMO01',
      unitId: 'unit-demo',
      status: SERVICE_ORDER_STATUSES.Released,
      origin: 'SERVICE_REQUEST',
      clientId: null,
      clientSnapshot: null,
      serviceDefinitionId: null,
      serviceDefinitionVersionId: null,
      serviceSnapshot: {
        serviceCode: 'SVC-DEMO',
        serviceName: 'Serviço Demo',
        requirements: {
          resources: [
            {
              physicalResourceTypeCode: 'TRUCK',
              requirementLevel: 'REQUIRED',
              minQuantity: '2',
              sortOrder: 1,
            },
          ],
          labor: [
            {
              laborTypeCode: 'OPERATOR',
              requirementLevel: 'REQUIRED',
              minQuantity: '1',
              sortOrder: 1,
            },
          ],
          execution: [],
        },
      },
      description: 'Ordem de demonstração',
      rowVersion: 1,
      preparedAt: '2026-01-01T08:00:00.000Z',
      releasedAt: '2026-01-01T09:00:00.000Z',
      cancelledAt: null,
      historyEvents: [],
    };
  }

  return vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = requestUrl(input);
    const method = init?.method ?? 'GET';
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/v1/resources/physical-assets' && method === 'GET') {
      const auth = init?.headers ? new Headers(init.headers).get('authorization') : null;
      if (!auth?.startsWith('Bearer ')) {
        return orderError('AUTH_UNAUTHORIZED', 401);
      }
      if (options.assetListAllowed === false) {
        return orderError('ASSET_DENIED', 403);
      }
      const limit = Number(parsedUrl.searchParams.get('limit') ?? '20');
      const offset = Number(parsedUrl.searchParams.get('offset') ?? '0');
      const resourceTypeId = parsedUrl.searchParams.get('resourceTypeId');
      let items = [...planningAssets];
      if (resourceTypeId) {
        items = items.filter((asset) => asset.resourceTypeId === resourceTypeId);
      }
      return jsonResponse({
        items: items.slice(offset, offset + limit),
        limit,
        offset,
      });
    }

    if (!pathname.startsWith('/api/v1/service-orders')) {
      return upstream(input, init);
    }

    const auth = init?.headers ? new Headers(init.headers).get('authorization') : null;
    if (!auth?.startsWith('Bearer ')) {
      return orderError('AUTH_UNAUTHORIZED', 401);
    }

    if (pathname === '/api/v1/service-orders' && method === 'GET') {
      if (!listAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      return jsonResponse({ items: [serviceOrderDetail(MOCK_SERVICE_ORDER_ID)], limit: 1, offset: 0 });
    }

    const orderMatch = pathname.match(/^\/api\/v1\/service-orders\/([^/]+)$/);
    if (orderMatch && method === 'GET') {
      if (!readAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      const orderId = orderMatch[1];
      if (orderId !== MOCK_SERVICE_ORDER_ID && orderId !== PROBE_SERVICE_ORDER_ID) {
        return orderError('SERVICE_ORDERS_NOT_FOUND', 404);
      }
      return jsonResponse(serviceOrderDetail(orderId));
    }

    const plannedListMatch = pathname.match(/^\/api\/v1\/service-orders\/([^/]+)\/planned-resources$/);
    if (plannedListMatch && method === 'GET') {
      if (!readAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      return jsonResponse(planned.filter((item) => item.serviceOrderId === plannedListMatch[1]));
    }

    if (plannedListMatch && method === 'POST') {
      if (!planAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as {
        requirementKind?: string;
        resourceTypeCode?: string;
        laborTypeCode?: string;
        plannedQuantity?: string;
      };
      const created: PlannedResource = {
        id: crypto.randomUUID(),
        serviceOrderId: plannedListMatch[1]!,
        requirementKind: (body.requirementKind as PlannedResource['requirementKind']) ?? 'PHYSICAL_RESOURCE',
        resourceTypeCode: body.resourceTypeCode ?? null,
        laborTypeCode: body.laborTypeCode ?? null,
        plannedQuantity: body.plannedQuantity ?? '1',
        operationalStart: null,
        operationalEnd: null,
        notes: null,
        status: 'ACTIVE',
        rowVersion: 1,
      };
      planned.push(created);
      return jsonResponse(created, 201);
    }

    const plannedItemMatch = pathname.match(
      /^\/api\/v1\/service-orders\/([^/]+)\/planned-resources\/([^/]+)(?:\/remove)?$/,
    );
    if (plannedItemMatch && (method === 'PATCH' || method === 'POST')) {
      if (!planAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      return orderError('SERVICE_ORDERS_NOT_FOUND', 404);
    }

    const allocationsListMatch = pathname.match(/^\/api\/v1\/service-orders\/([^/]+)\/allocations$/);
    if (allocationsListMatch && method === 'GET') {
      if (!readAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      return jsonResponse(allocations.filter((item) => item.serviceOrderId === allocationsListMatch[1]));
    }

    if (allocationsListMatch && method === 'POST') {
      if (!allocateAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as {
        plannedResourceId?: string;
        physicalAssetId?: string;
        operationalStart?: string;
        operationalEnd?: string;
      };
      const asset = planningAssets.find((item) => item.id === body.physicalAssetId);
      if (!asset) {
        return orderError('SERVICE_ORDERS_ASSET_NOT_FOUND', 404);
      }
      if (asset.lifecycleStatus !== ASSET_LIFECYCLE_STATUSES.Active) {
        return orderError('SERVICE_ORDERS_ASSET_INACTIVE', 409);
      }
      const interval = parseInterval(body.operationalStart ?? '', body.operationalEnd ?? '');
      const conflict = allocations.some(
        (item) =>
          item.status === 'ACTIVE' &&
          item.physicalAssetId === body.physicalAssetId &&
          intervalsOverlap(interval, parseInterval(item.operationalStart, item.operationalEnd)),
      );
      if (conflict) {
        return orderError('SERVICE_ORDERS_ALLOCATION_CONFLICT', 409);
      }
      const created: ResourceAllocation = {
        id: crypto.randomUUID(),
        serviceOrderId: allocationsListMatch[1]!,
        plannedResourceId: body.plannedResourceId ?? null,
        physicalAssetId: body.physicalAssetId!,
        resourceTypeCode: asset.resourceTypeCode,
        operationalStart: body.operationalStart!,
        operationalEnd: body.operationalEnd!,
        status: 'ACTIVE',
        rowVersion: 1,
        allocatedAt: new Date().toISOString(),
        removedAt: null,
      };
      allocations.push(created);
      return jsonResponse({ ...created, historyEvents: [] }, 201);
    }

    const allocationRemoveMatch = pathname.match(
      /^\/api\/v1\/service-orders\/([^/]+)\/allocations\/([^/]+)\/remove$/,
    );
    if (allocationRemoveMatch && method === 'POST') {
      if (!removeAllocationAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      const allocation = allocations.find((item) => item.id === allocationRemoveMatch[2]);
      if (!allocation) {
        return orderError('SERVICE_ORDERS_ALLOCATION_NOT_FOUND', 404);
      }
      allocation.status = 'REMOVED';
      allocation.removedAt = new Date().toISOString();
      allocation.rowVersion += 1;
      return jsonResponse({ ...allocation, historyEvents: [] });
    }

    const reallocateMatch = pathname.match(
      /^\/api\/v1\/service-orders\/([^/]+)\/allocations\/([^/]+)\/reallocate$/,
    );
    if (reallocateMatch && method === 'POST') {
      if (!allocateAllowed) {
        return orderError('SERVICE_ORDERS_DENIED', 403);
      }
      return orderError('SERVICE_ORDERS_NOT_FOUND', 404);
    }

    return upstream(input, init);
  });
}
