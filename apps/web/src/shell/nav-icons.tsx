import {
  BarChart3,
  Bell,
  BookOpen,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const SHELL_NAV_ICONS: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  clients: Users,
  requests: FileText,
  proposals: ScrollText,
  'purchase-orders': ShoppingCart,
  catalog: BookOpen,
  assets: Package,
  alerts: Bell,
  billing: Receipt,
  reports: BarChart3,
  platform: Settings,
};

export function resolveNavIcon(itemId: string): LucideIcon {
  return SHELL_NAV_ICONS[itemId] ?? LayoutDashboard;
}
