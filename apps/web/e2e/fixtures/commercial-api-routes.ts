import type { Route } from '@playwright/test';
import {
  COMMERCIAL_CLIENTS_SNAPSHOT,
  COMMERCIAL_PROPOSAL_DETAIL_SNAPSHOT,
  COMMERCIAL_PROPOSAL_VERSIONS_SNAPSHOT,
  COMMERCIAL_PROPOSALS_LIST_SNAPSHOT,
  COMMERCIAL_PURCHASE_ORDER_DETAIL_SNAPSHOT,
  COMMERCIAL_PURCHASE_ORDERS_LIST_SNAPSHOT,
  VISUAL_PROPOSAL_ID,
  VISUAL_PURCHASE_ORDER_ID,
} from './commercial-snapshots';

type JsonResponse = {
  status: number;
  contentType: string;
  body: string;
};

function jsonBody(body: unknown, status = 200): JsonResponse {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill(jsonBody(body, status));
}

function hasBearerToken(route: Route): boolean {
  return route.request().headers().authorization?.startsWith('Bearer ') ?? false;
}

/**
 * Handles deterministic commercial API traffic for Playwright screenshots.
 * Returns false when the route does not belong to the commercial fixture.
 */
export async function handleCommercialApiRoute(route: Route): Promise<boolean> {
  const request = route.request();
  const url = new URL(request.url());
  const { pathname } = url;
  const method = request.method();
  const isClientRoute = pathname.startsWith('/api/v1/clients');
  const isCommercialRoute = pathname.startsWith('/api/v1/commercial/');

  if (!isClientRoute && !isCommercialRoute) {
    return false;
  }

  if (!hasBearerToken(route)) {
    await fulfillJson(route, { code: 'COMMERCIAL_DENIED', message: 'Unauthorized.' }, 401);
    return true;
  }

  if (pathname === '/api/v1/clients' && method === 'GET') {
    await fulfillJson(route, COMMERCIAL_CLIENTS_SNAPSHOT);
    return true;
  }

  if (isClientRoute) {
    await fulfillJson(route, { code: 'CLIENT_NOT_FOUND', message: 'Not found.' }, 404);
    return true;
  }

  const proposalsBase = '/api/v1/commercial/proposals';
  if (pathname === proposalsBase && method === 'GET') {
    await fulfillJson(route, COMMERCIAL_PROPOSALS_LIST_SNAPSHOT);
    return true;
  }
  if (pathname === proposalsBase && method === 'POST') {
    await fulfillJson(
      route,
      { code: 'COMMERCIAL_VALIDATION_FAILED', message: 'Capability probe.' },
      400,
    );
    return true;
  }
  if (
    pathname === `${proposalsBase}/${VISUAL_PROPOSAL_ID}/versions` &&
    method === 'GET'
  ) {
    await fulfillJson(route, COMMERCIAL_PROPOSAL_VERSIONS_SNAPSHOT);
    return true;
  }
  if (pathname === `${proposalsBase}/${VISUAL_PROPOSAL_ID}` && method === 'GET') {
    await fulfillJson(route, COMMERCIAL_PROPOSAL_DETAIL_SNAPSHOT);
    return true;
  }
  if (pathname.startsWith(`${proposalsBase}/`)) {
    await fulfillJson(
      route,
      { code: 'COMMERCIAL_PROPOSAL_NOT_FOUND', message: 'Capability probe.' },
      404,
    );
    return true;
  }

  const purchaseOrdersBase = '/api/v1/commercial/purchase-orders';
  if (pathname === purchaseOrdersBase && method === 'GET') {
    await fulfillJson(route, COMMERCIAL_PURCHASE_ORDERS_LIST_SNAPSHOT);
    return true;
  }
  if (pathname === purchaseOrdersBase && method === 'POST') {
    await fulfillJson(
      route,
      { code: 'COMMERCIAL_VALIDATION_FAILED', message: 'Capability probe.' },
      400,
    );
    return true;
  }
  if (
    pathname === `${purchaseOrdersBase}/${VISUAL_PURCHASE_ORDER_ID}` &&
    method === 'GET'
  ) {
    await fulfillJson(route, COMMERCIAL_PURCHASE_ORDER_DETAIL_SNAPSHOT);
    return true;
  }
  if (pathname.startsWith(`${purchaseOrdersBase}/`)) {
    await fulfillJson(
      route,
      { code: 'COMMERCIAL_PURCHASE_ORDER_NOT_FOUND', message: 'Capability probe.' },
      404,
    );
    return true;
  }

  await fulfillJson(route, { code: 'COMMERCIAL_NOT_FOUND', message: 'Not found.' }, 404);
  return true;
}
