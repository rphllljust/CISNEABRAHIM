import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { AuthProvider } from '../auth/context/AuthProvider';
import type { ReactElement } from 'react';

type Options = RenderOptions & {
  router?: MemoryRouterProps;
};

export function renderWithProviders(ui: ReactElement, options: Options = {}): RenderResult {
  const { router, ...renderOptions } = options;
  return render(
    <AuthProvider>
      <MemoryRouter {...router}>{ui}</MemoryRouter>
    </AuthProvider>,
    renderOptions,
  );
}
