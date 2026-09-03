import type { ReactNode } from 'react';
import { ModuleDeniedState, ModuleErrorState, ModuleLoadingState } from '../ui/module-layout';
import type { QueryState } from './useBackofficeQuery';

export function renderQueryGate<T>(
  title: string,
  loadingMessage: string,
  deniedMessage: string,
  state: QueryState<T>,
  onRetry: () => void,
): ReactNode | null {
  if (state.phase === 'loading') {
    return <ModuleLoadingState title={title} message={loadingMessage} />;
  }
  if (state.phase === 'denied') {
    return <ModuleDeniedState title={title} message={deniedMessage} />;
  }
  if (state.phase === 'error') {
    return (
      <ModuleErrorState
        title={title}
        message={state.message}
        retryable={state.retryable}
        onRetry={onRetry}
      />
    );
  }
  return null;
}
