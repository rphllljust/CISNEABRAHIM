import { HttpStatus } from '@nestjs/common';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';

export function catalogAccessDenied(): CatalogHttpException {
  return new CatalogHttpException(HttpStatus.FORBIDDEN, CATALOG_ERROR_CODES.DENIED, 'Access denied.');
}

export function catalogAccessNotFound(): CatalogHttpException {
  return new CatalogHttpException(
    HttpStatus.NOT_FOUND,
    CATALOG_ERROR_CODES.NOT_FOUND,
    'Service definition not found.',
  );
}

export function catalogVersionConflict(): CatalogHttpException {
  return new CatalogHttpException(
    HttpStatus.CONFLICT,
    CATALOG_ERROR_CODES.VERSION_CONFLICT,
    'Service definition was modified by another request.',
  );
}

export function isUniqueCatalogCodeViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const pgError = error as { code?: string; constraint?: string };
  return pgError.code === '23505' && (pgError.constraint?.includes('code') ?? false);
}
