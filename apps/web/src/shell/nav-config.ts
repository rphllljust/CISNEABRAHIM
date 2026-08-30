import type { ShellNavItem } from './types';

/**
 * Navegação estrutural — reflete capabilities candidatas sem implementar módulos empresariais.
 * Visibilidade de itens com accessCheck é decidida pelo backend (probe authz).
 */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  {
    id: 'reports',
    label: 'Relatórios',
    path: '/app/reports',
    capabilityId: 'service-orders:service-order:list',
    accessCheck: 'request-list',
  },
  {
    id: 'alerts',
    label: 'Alertas',
    path: '/app/alerts',
    capabilityId: 'service-orders:service-order:list',
    accessCheck: 'request-list',
  },
  {
    id: 'home',
    label: 'Home',
    path: '/app',
    capabilityId: null,
  },
  {
    id: 'platform',
    label: 'Platform diagnostics',
    path: '/app/platform',
    capabilityId: 'CAP-001',
    accessCheck: 'authz-probe',
  },
  {
    id: 'clients',
    label: 'Clientes',
    path: '/app/clients',
    capabilityId: 'client:client:list',
    accessCheck: 'client-list',
  },
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
    id: 'requests',
    label: 'Solicitações',
    path: '/app/requests',
    capabilityId: 'requests:service-request:list',
    accessCheck: 'request-list',
  },
  {
    id: 'billing',
    label: 'Faturamento',
    path: '/app/billing',
    capabilityId: 'billing:billing-record:read',
    accessCheck: 'billing-list',
  },
];

export function findNavItemByPath(pathname: string): ShellNavItem | undefined {
  return SHELL_NAV_ITEMS.find((item) => item.path === pathname);
}
