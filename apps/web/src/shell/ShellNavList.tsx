import { NavLink } from 'react-router-dom';
import { isNavItemVisible, useNavAccess } from './useNavAccess';
import { SHELL_NAV_GROUPS } from './nav-config';

type ShellNavListProps = {
  onNavigate?: () => void;
  alertCount?: number;
  alertsLoading?: boolean;
};

export function ShellNavList({ onNavigate, alertCount = 0, alertsLoading = false }: ShellNavListProps) {
  const { loading, access } = useNavAccess();

  return (
    <nav className="shell-nav" aria-label="Navegação principal">
      {loading ? (
        <p className="shell-nav__status" aria-live="polite">
          Carregando navegação…
        </p>
      ) : null}
      {SHELL_NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => isNavItemVisible(item.id, access, loading));
        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <section key={group.id} className="shell-nav__group" aria-label={group.label}>
            <h2 className="shell-nav__group-label">{group.label}</h2>
            <ul className="shell-nav__list">
              {visibleItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `shell-nav__link${isActive ? ' shell-nav__link--active' : ''}`
                    }
                    end={item.path === '/app'}
                    onClick={onNavigate}
                  >
                    {item.label}
                    {item.id === 'alerts' && !alertsLoading && alertCount > 0 ? (
                      <span className="shell-nav__badge" aria-hidden="true">
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
