import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VersionComparePanel } from './VersionComparePanel';

describe('VersionComparePanel', () => {
  it('renders an accessible comparison table with differences', () => {
    render(
      <VersionComparePanel
        leftVersion={1}
        rightVersion={2}
        diffs={[{ field: 'Nome', left: 'A', right: 'B' }]}
      />,
    );

    expect(screen.getByRole('heading', { name: /comparação v1 × v2/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /diferenças entre versões/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Campo' })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
