import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAlertBadge } from '../alerts/hooks/useAlerts';
import { ShellBreadcrumbs } from './ShellBreadcrumbs';
import { ShellErrorBoundary } from './ShellErrorBoundary';
import { ShellMobileDrawer } from './ShellMobileDrawer';
import { ShellNavList } from './ShellNavList';
import { ShellTopBar } from './ShellTopBar';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useRouteFocus } from './hooks/useRouteFocus';
import './shell.css';

export function AppShellLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 64rem)');
  const { activeCount, loading: alertsLoading } = useAlertBadge();

  useRouteFocus();

  function toggleMobileNav() {
    setMobileNavOpen((open) => !open);
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  return (
    <div className="shell">
      <a className="shell__skip-link" href="#main-content">
        Ir para o conteúdo principal
      </a>
      <div className="shell__frame">
        <aside className="shell__sidebar" aria-label="Barra lateral">
          <div className="shell__sidebar-brand">
            <p className="shell__sidebar-brand-title">Cisne Rondônia</p>
            <p className="shell__sidebar-brand-subtitle">Gestão operacional e financeira</p>
          </div>
          <ShellNavList alertCount={activeCount} alertsLoading={alertsLoading} />
        </aside>
        <div className="shell__workspace">
          <ShellTopBar onMenuToggle={toggleMobileNav} menuExpanded={mobileNavOpen && !isDesktop} />
          <ShellBreadcrumbs />
          <div className="shell-page-frame">
            <ShellErrorBoundary>
              <Outlet />
            </ShellErrorBoundary>
          </div>
        </div>
      </div>
      {!isDesktop ? (
        <div id="shell-mobile-drawer">
          <ShellMobileDrawer
            open={mobileNavOpen}
            onClose={closeMobileNav}
            alertCount={activeCount}
            alertsLoading={alertsLoading}
          />
        </div>
      ) : null}
    </div>
  );
}
