import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import { parseRequestPath } from '../test/request-url';
import { GrantsTab } from './pages/GrantsTab';
import { MatricesTab } from './pages/MatricesTab';
import { UsersTab } from './pages/UsersTab';

/**
 * Testes do console estendido de administração de acesso (Concessões, Usuários
 * e Aprovações). O frontend NUNCA decide autoridade: os testes apenas verificam
 * que as abas renderizam o que a API (mockada) retorna e que a seleção de um
 * usuário/matriz dispara as leituras correspondentes. Nenhuma rede real.
 */

const MOCK_IDENTITIES = [
  {
    id: 'user-1',
    login: 'maria.silva',
    status: 'active',
    disabledAt: null,
    createdAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 'user-2',
    login: 'joao.oliveira',
    status: 'locked',
    disabledAt: '2026-02-02T10:00:00.000Z',
    createdAt: '2025-01-15T10:00:00.000Z',
  },
];

const GRANT_GLOBAL = {
  id: 'grant-1',
  identityId: 'identity-1',
  action: 'finance:payable:read',
  resourceType: 'finance:payable',
  resourceId: null,
  scopeType: 'GLOBAL',
  version: 1,
  validFrom: '2026-01-01T00:00:00.000Z',
  validUntil: null,
  revokedAt: null,
};

const GRANT_ANCHORED = {
  id: 'grant-2',
  identityId: 'identity-2',
  action: 'catalog:service:read',
  resourceType: 'catalog:service',
  resourceId: 'unit-42',
  scopeType: 'UNIT',
  version: 2,
  validFrom: '2026-01-01T00:00:00.000Z',
  validUntil: '2026-12-31T00:00:00.000Z',
  revokedAt: null,
};

const USER_GRANT = {
  id: 'grant-3',
  identityId: 'user-1',
  action: 'documents:document:read',
  resourceType: 'documents:document',
  resourceId: null,
  scopeType: 'GLOBAL',
  version: 1,
  validFrom: '2026-01-01T00:00:00.000Z',
  validUntil: null,
  revokedAt: null,
};

const MOCK_MATRIX = {
  id: 'matrix-1',
  code: 'COMPRAS',
  currencyCode: 'BRL',
  publishedVersion: 2,
  draftVersion: 3,
  publishedVersions: 2,
  draftVersions: 1,
};

const MOCK_MATRIX_RULES = [
  {
    id: 'rule-1',
    operation: 'PURCHASE',
    roleCode: 'FINANCIAL_MANAGER',
    capability: 'purchase-approve',
    scopeType: 'GLOBAL',
    scopeAnchor: null,
    amountLimit: '50000.00',
    lineNumber: 10,
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function errorResponse(code: string, status: number): Response {
  return jsonResponse({ error: { code, message: 'error' } }, status);
}

function createConsoleFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const { pathname, searchParams } = parseRequestPath(input);
    const method = init?.method ?? 'GET';

    if (pathname === '/api/v1/authz/access-admin/identities' && method === 'GET') {
      const query = (searchParams.get('query') ?? '').toLowerCase();
      const filtered = MOCK_IDENTITIES.filter((identity) =>
        (identity.login ?? '').toLowerCase().includes(query),
      );
      return jsonResponse(filtered);
    }

    if (pathname === '/api/v1/authz/access-admin/grants' && method === 'GET') {
      const identityId = searchParams.get('identityId');
      if (identityId === 'user-1') {
        return jsonResponse([USER_GRANT]);
      }
      return jsonResponse([GRANT_GLOBAL, GRANT_ANCHORED]);
    }

    if (pathname === '/api/v1/authz/access-admin/assignments' && method === 'GET') {
      return jsonResponse([]);
    }

    if (pathname === '/api/v1/authz/access-admin/approval-role-assignments' && method === 'GET') {
      return jsonResponse([]);
    }

    if (
      pathname.startsWith('/api/v1/authz/access-admin/approval-matrices/') &&
      pathname.endsWith('/rules') &&
      method === 'GET'
    ) {
      return jsonResponse(MOCK_MATRIX_RULES);
    }

    if (pathname === '/api/v1/authz/access-admin/approval-matrices' && method === 'GET') {
      return jsonResponse([MOCK_MATRIX]);
    }

    if (pathname === '/api/v1/authz/access-admin/catalog' && method === 'GET') {
      return jsonResponse({
        capabilities: [
          { code: 'finance:payable:read', kind: 'action', class: 'FINANCIAL_APPROVAL' },
          { code: 'authz:access-admin:read', kind: 'access-admin', class: 'ACCESS_ADMIN' },
          { code: 'sod:pair:rule', kind: 'sod' },
        ],
        scopes: [
          { code: 'UNIT', anchored: true },
          { code: 'CLIENT', anchored: true },
          { code: 'GLOBAL', anchored: false },
        ],
        resources: [
          { code: 'finance:payable' },
          { code: 'catalog:service' },
          { code: 'documents:document' },
        ],
      });
    }

    return errorResponse('UNKNOWN', 404);
  });
}

describe('access-admin console estendido', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    vi.unstubAllGlobals();
    tokenStore.setTokens('access-token', 'refresh-token');
  });

  it('(a) GrantsTab renderiza as concessões retornadas por listGrants com a coluna de ação', async () => {
    vi.stubGlobal('fetch', createConsoleFetchMock());

    render(<GrantsTab />);

    await waitFor(() => {
      expect(screen.getByText('finance:payable:read')).toBeInTheDocument();
    });
    expect(screen.getByText('catalog:service:read')).toBeInTheDocument();
    // A coluna de identidade exibe o identityId (GrantInfo não traz login).
    expect(screen.getByText('identity-1')).toBeInTheDocument();
  });

  it('(b) UsersTab lista usuários e, ao selecionar um, mostra as concessões ativas', async () => {
    vi.stubGlobal('fetch', createConsoleFetchMock());
    const user = userEvent.setup();

    render(<UsersTab />);

    await screen.findByText('maria.silva');
    expect(screen.getByText('joao.oliveira')).toBeInTheDocument();

    await user.click(screen.getByText('maria.silva'));

    await waitFor(() => {
      expect(screen.getByText('Visão do usuário')).toBeInTheDocument();
    });
    // A seleção dispara listGrants(identityId) e a tabela mostra a ação retornada.
    await waitFor(() => {
      expect(screen.getByText('documents:document:read')).toBeInTheDocument();
    });
  });

  it('(c) MatricesTab renderiza a visão geral e, ao selecionar, mostra as regras publicadas', async () => {
    vi.stubGlobal('fetch', createConsoleFetchMock());
    const user = userEvent.setup();

    render(<MatricesTab />);

    await screen.findByText('COMPRAS');
    expect(screen.getByText('BRL')).toBeInTheDocument();

    await user.click(screen.getByText('COMPRAS'));

    await waitFor(() => {
      expect(screen.getByText('PURCHASE')).toBeInTheDocument();
    });
    expect(screen.getByText('FINANCIAL_MANAGER')).toBeInTheDocument();
  });
});
