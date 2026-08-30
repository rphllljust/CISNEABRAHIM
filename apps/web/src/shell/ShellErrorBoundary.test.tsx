import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ShellErrorBoundary } from './ShellErrorBoundary';

function BrokenChild(): never {
  throw new Error('boom');
}

describe('ShellErrorBoundary', () => {
  it('renders unexpected error UI without leaking details', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <ShellErrorBoundary>
          <BrokenChild />
        </ShellErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/erro inesperado/i);
    expect(screen.getByRole('button', { name: /voltar ao painel/i })).toBeInTheDocument();
  });
});
