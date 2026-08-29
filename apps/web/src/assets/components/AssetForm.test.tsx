import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AssetForm } from './AssetForm';
import { VEHICLE_CLASSIFICATION } from '../types/physical-asset.types';

const RESOURCE_TYPES = [
  {
    id: 'truck',
    code: 'TRUCK',
    name: 'Caminhão',
    classification: VEHICLE_CLASSIFICATION,
    status: 'ACTIVE',
  },
  {
    id: 'exc',
    code: 'EXCAVATOR',
    name: 'Escavadeira',
    classification: 'MACHINE',
    status: 'ACTIVE',
  },
];

describe('AssetForm', () => {
  it('shows vehicle fields only when vehicle resource type is selected', () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <AssetForm
        mode="create"
        values={{
          assetCode: '',
          resourceTypeId: 'exc',
          name: '',
          unitId: '',
          plate: '',
          chassis: '',
          model: '',
        }}
        resourceTypes={RESOURCE_TYPES}
        resourceTypesLoading={false}
        fieldErrors={{}}
        submitError={null}
        submitting={false}
        onChange={onChange}
        onSubmit={(event) => event.preventDefault()}
        cancelHref="/app/assets"
      />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText(/placa/i)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <AssetForm
        mode="create"
        values={{
          assetCode: '',
          resourceTypeId: 'truck',
          name: '',
          unitId: '',
          plate: '',
          chassis: '',
          model: '',
        }}
        resourceTypes={RESOURCE_TYPES}
        resourceTypesLoading={false}
        fieldErrors={{}}
        submitError={null}
        submitting={false}
        onChange={onChange}
        onSubmit={(event) => event.preventDefault()}
        cancelHref="/app/assets"
      />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
  });

  it('exposes accessible labels for core fields', () => {
    render(
      <MemoryRouter>
        <AssetForm
        mode="create"
        values={{
          assetCode: 'TRK-1',
          resourceTypeId: 'truck',
          name: 'Caminhão',
          unitId: 'unit-a',
          plate: 'ABC-1234',
          chassis: '',
          model: '',
        }}
        resourceTypes={RESOURCE_TYPES}
        resourceTypesLoading={false}
        fieldErrors={{}}
        submitError={null}
        submitting={false}
        onChange={() => undefined}
        onSubmit={(event) => event.preventDefault()}
        cancelHref="/app/assets"
      />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/código do ativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome \/ descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
  });
});
