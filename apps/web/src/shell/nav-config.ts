import type { ShellNavItem } from './types';

/**
 * Navegação estrutural — reflete capabilities candidatas sem implementar módulos empresariais.
 * Visibilidade de itens com accessCheck é decidida pelo backend (probe authz).
 */
export const SHELL_NAV_ITEMS: ShellNavItem[] = [
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
];

export function findNavItemByPath(pathname: string): ShellNavItem | undefined {
  return SHELL_NAV_ITEMS.find((item) => item.path === pathname);
}
