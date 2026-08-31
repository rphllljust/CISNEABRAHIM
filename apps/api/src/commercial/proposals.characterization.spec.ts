import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_ERROR_CODES } from './errors/commercial-error-codes';
import { CommercialHttpException } from './errors/commercial-http.exception';
import {
  proposalsAccessDenied,
  proposalsAccessNotFound,
  proposalsVersionConflict,
} from './services/proposals-access.errors';
import { assertValidProposalId } from './services/proposals-input-resolution';

describe('Commercial proposals characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = proposalsAccessDenied();
    expect(error).toBeInstanceOf(CommercialHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ error: { code: COMMERCIAL_ERROR_CODES.DENIED } });
  });

  it('maps missing proposal to NOT_FOUND', () => {
    const error = proposalsAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({ error: { code: COMMERCIAL_ERROR_CODES.NOT_FOUND } });
  });

  it('maps optimistic concurrency to VERSION_CONFLICT', () => {
    const error = proposalsVersionConflict();
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ error: { code: COMMERCIAL_ERROR_CODES.VERSION_CONFLICT } });
  });

  it('treats invalid proposal UUID as not found without leaking validation detail', () => {
    expect(() => assertValidProposalId('not-a-uuid')).toThrow(CommercialHttpException);
    try {
      assertValidProposalId('not-a-uuid');
    } catch (error) {
      const httpError = error as CommercialHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({ error: { code: COMMERCIAL_ERROR_CODES.NOT_FOUND } });
    }
  });
});

// Integration baseline: apps/api/src/commercial/proposals.integration.spec.ts
