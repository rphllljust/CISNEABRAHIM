import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CATALOG_ERROR_CODES } from './errors/catalog-error-codes';
import { CatalogHttpException } from './errors/catalog-http.exception';
import {
  catalogAccessDenied,
  catalogAccessNotFound,
  catalogVersionConflict,
  isUniqueCatalogCodeViolation,
} from './services/service-catalog-access.errors';
import { assertValidCatalogDefinitionId } from './services/service-catalog-input-resolution';

describe('Service catalog characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = catalogAccessDenied();
    expect(error).toBeInstanceOf(CatalogHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ error: { code: CATALOG_ERROR_CODES.DENIED } });
  });

  it('maps missing definition to NOT_FOUND', () => {
    const error = catalogAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({ error: { code: CATALOG_ERROR_CODES.NOT_FOUND } });
  });

  it('maps optimistic concurrency to VERSION_CONFLICT', () => {
    const error = catalogVersionConflict();
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ error: { code: CATALOG_ERROR_CODES.VERSION_CONFLICT } });
  });

  it('detects unique code PostgreSQL violations', () => {
    expect(isUniqueCatalogCodeViolation({ code: '23505', constraint: 'service_definitions_code_key' })).toBe(true);
    expect(isUniqueCatalogCodeViolation({ code: '23505', constraint: 'other_unique' })).toBe(false);
    expect(isUniqueCatalogCodeViolation(null)).toBe(false);
  });

  it('treats invalid definition UUID as not found without leaking validation detail', () => {
    expect(() => assertValidCatalogDefinitionId('not-a-uuid')).toThrow(CatalogHttpException);
    try {
      assertValidCatalogDefinitionId('not-a-uuid');
    } catch (error) {
      const httpError = error as CatalogHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({ error: { code: CATALOG_ERROR_CODES.NOT_FOUND } });
    }
  });
});
