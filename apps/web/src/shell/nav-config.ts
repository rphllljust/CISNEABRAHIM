import type { ShellNavGroup, ShellNavItem } from './types';

/**
 * Navegação estrutural agrupada por domínio.
 * Visibilidade com accessCheck é decidida pelo backend (probes existentes).
 */
export const SHELL_NAV_GROUPS: ShellNavGroup[] = [
  {
    id: 'overview',
    label: 'Visão geral',
    items: [
      {
        id: 'home',
        label: 'Painel operacional',
        path: '/app',
        capabilityId: null,
      },
    ],
  },
  {
    id: 'commercial',
    label: 'Comercial',
    items: [
      {
        id: 'clients',
        label: 'Clientes',
        path: '/app/clients',
        capabilityId: 'client:client:list',
        accessCheck: 'client-list',
      },
      {
        id: 'requests',
        label: 'Solicitações',
        path: '/app/requests',
        capabilityId: 'requests:service-request:list',
        accessCheck: 'request-list',
      },
      {
        id: 'proposals',
        label: 'Propostas',
        path: '/app/proposals',
        capabilityId: 'commercial:proposal:list',
        accessCheck: 'proposal-list',
      },
      {
        id: 'purchase-orders',
        label: 'Pedidos de compra',
        path: '/app/purchase-orders',
        capabilityId: 'commercial:purchase-order:list',
        accessCheck: 'purchase-order-list',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operações',
    items: [
      {
        id: 'catalog',
        label: 'Catálogo de serviços',
        path: '/app/catalog',
        capabilityId: 'catalog:service:list',
        accessCheck: 'catalog-list',
      },
      {
        id: 'assets',
        label: 'Ativos físicos',
        path: '/app/assets',
        capabilityId: 'resources:asset:list',
        accessCheck: 'asset-list',
      },
      {
        id: 'people',
        label: 'Pessoas',
        path: '/app/people',
        capabilityId: 'people:person:list',
        accessCheck: 'people-list',
      },
      {
        id: 'service-orders',
        label: 'Ordens de serviço',
        path: '/app/service-orders',
        capabilityId: 'service-orders:service-order:list',
        accessCheck: 'service-order-list',
      },
      {
        id: 'alerts',
        label: 'Alertas',
        path: '/app/alerts',
        capabilityId: 'service-orders:service-order:list',
        accessCheck: 'request-list',
      },
    ],
  },
  {
    id: 'financial',
    label: 'Medições e financeiro',
    items: [
      {
        id: 'billing',
        label: 'Faturamento',
        path: '/app/billing',
        capabilityId: 'billing:billing-record:read',
        accessCheck: 'billing-list',
      },
    ],
  },
  {
    id: 'insights',
    label: 'Relatórios',
    items: [
      {
        id: 'reports',
        label: 'Relatórios',
        path: '/app/reports',
        capabilityId: 'service-orders:service-order:list',
        accessCheck: 'request-list',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    items: [
      {
        id: 'platform',
        label: 'Diagnóstico da plataforma',
        path: '/app/platform',
        capabilityId: 'CAP-001',
        accessCheck: 'authz-probe',
      },
    ],
  },
];

export const SHELL_NAV_ITEMS: ShellNavItem[] = SHELL_NAV_GROUPS.flatMap((group) => group.items);

const STATIC_ROUTE_LABELS: Record<string, string> = {
  '/app': 'Painel operacional',
  '/app/clients': 'Clientes',
  '/app/clients/new': 'Novo cliente',
  '/app/catalog': 'Catálogo de serviços',
  '/app/catalog/new': 'Nova definição',
  '/app/assets': 'Ativos físicos',
  '/app/assets/new': 'Novo ativo',
  '/app/people': 'Pessoas',
  '/app/people/new': 'Nova pessoa',
  '/app/requests': 'Solicitações',
  '/app/requests/new': 'Nova solicitação',
  '/app/proposals': 'Propostas',
  '/app/proposals/new': 'Nova proposta',
  '/app/purchase-orders': 'Pedidos de compra',
  '/app/purchase-orders/new': 'Novo pedido de compra',
  '/app/billing': 'Faturamento',
  '/app/alerts': 'Alertas',
  '/app/reports': 'Relatórios',
  '/app/search': 'Pesquisa',
  '/app/platform': 'Diagnóstico da plataforma',
  '/app/no-access': 'Acesso negado',
};

export function findNavItemByPath(pathname: string): ShellNavItem | undefined {
  return SHELL_NAV_ITEMS.find((item) => item.path === pathname);
}

export function resolveShellBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: 'Início', href: '/app' },
  ];

  if (pathname === '/app') {
    crumbs.push({ label: 'Painel operacional' });
    return crumbs;
  }

  const staticLabel = STATIC_ROUTE_LABELS[pathname];
  if (staticLabel) {
    const parentPath = pathname.split('/').slice(0, -1).join('/') || '/app';
    const parentLabel = STATIC_ROUTE_LABELS[parentPath];
    if (parentLabel && parentPath !== pathname) {
      crumbs.push({ label: parentLabel, href: parentPath });
    }
    crumbs.push({ label: staticLabel });
    return crumbs;
  }

  const segments = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean);
  if (segments.length === 0) {
    crumbs.push({ label: 'Painel operacional' });
    return crumbs;
  }

  const section = segments[0];
  const sectionItem = SHELL_NAV_ITEMS.find((item) => item.path === `/app/${section}`);
  if (sectionItem) {
    crumbs.push({ label: sectionItem.label, href: sectionItem.path });
  }

  if (segments.length > 1) {
    crumbs.push({ label: 'Detalhe' });
  }

  return crumbs;
}
