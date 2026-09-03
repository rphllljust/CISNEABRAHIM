import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isReleaseModuleEnabled } from './feature-flags';
import { matchGatedWebPath } from './release-1-scope';

type ReleaseScopeGateProps = {
  children?: ReactNode;
};

export function ReleaseScopeGate({ children = null }: ReleaseScopeGateProps) {
  const location = useLocation();
  const moduleId = matchGatedWebPath(location.pathname);
  if (moduleId && !isReleaseModuleEnabled(moduleId)) {
    return (
      <Navigate
        to="/app/no-access"
        replace
        state={{
          from: location.pathname,
          reason: 'feature_disabled',
          moduleId,
        }}
      />
    );
  }

  return children;
}
