import { describe, expect, it } from 'vitest';
import {
  createEmptyFormState,
  toCreatePayload,
  validateServiceDefinitionForm,
} from './catalog-form-state';

describe('catalog form state', () => {
  it('validates required create fields', () => {
    const errors = validateServiceDefinitionForm(createEmptyFormState(), { includeCode: true });
    expect(errors.code).toBeDefined();
    expect(errors.name).toBeDefined();
    expect(errors.categoryId).toBeDefined();
  });

  it('builds create payload with uppercase code', () => {
    const state = {
      ...createEmptyFormState(),
      code: 'rental-auto',
      name: 'Locação',
      categoryId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    };
    expect(toCreatePayload(state).code).toBe('RENTAL-AUTO');
  });
});
