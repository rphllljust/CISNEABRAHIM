import { describe, expect, it } from 'vitest';
import {
  parseClampedOffsetLimit,
  parseCommercialEntityListQuery,
  parseLenientRowVersionBody,
  parseLinkDocumentInput,
  parsePositiveVersionNumberParam,
  parseQueryPositiveInt,
  toDocumentLinkResponse,
  toHistoryEventResponse,
} from './index';

describe('http contracts', () => {
  describe('parseClampedOffsetLimit', () => {
    it('defaults limit and offset', () => {
      expect(parseClampedOffsetLimit({})).toEqual({ limit: 20, offset: 0 });
    });

    it('clamps limit to [1, 100]', () => {
      expect(parseClampedOffsetLimit({ limit: 0 }).limit).toBe(1);
      expect(parseClampedOffsetLimit({ limit: 500 }).limit).toBe(100);
    });

    it('falls back on non-finite values', () => {
      expect(parseClampedOffsetLimit({ limit: 'x', offset: 'y' })).toEqual({
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('parseCommercialEntityListQuery', () => {
    it('parses clientId and unitId filters', () => {
      expect(
        parseCommercialEntityListQuery({
          clientId: 'c1',
          unitId: 'u1',
          limit: 10,
          offset: 5,
        }),
      ).toEqual({ clientId: 'c1', unitId: 'u1', limit: 10, offset: 5 });
    });
  });

  describe('parseQueryPositiveInt', () => {
    it('accepts integer numbers and digit strings', () => {
      expect(parseQueryPositiveInt(3)).toBe(3);
      expect(parseQueryPositiveInt('12')).toBe(12);
    });

    it('rejects invalid values', () => {
      expect(parseQueryPositiveInt('12a')).toBeNull();
      expect(parseQueryPositiveInt(1.5)).toBeNull();
    });
  });

  describe('parseLinkDocumentInput', () => {
    it('parses document link body', () => {
      expect(
        parseLinkDocumentInput({ documentId: 'd1', linkPurpose: 'EVIDENCE' }),
      ).toEqual({ documentId: 'd1', linkPurpose: 'EVIDENCE' });
    });

    it('rejects invalid body', () => {
      expect(() => parseLinkDocumentInput(null)).toThrow('body invalid');
      expect(() => parseLinkDocumentInput({ documentId: 1, linkPurpose: 'x' })).toThrow(
        'documentId invalid',
      );
    });
  });

  describe('parseLenientRowVersionBody', () => {
    it('coerces rowVersion with Number()', () => {
      expect(parseLenientRowVersionBody({ rowVersion: '3' })).toEqual({ rowVersion: 3 });
    });
  });

  describe('parsePositiveVersionNumberParam', () => {
    it('accepts positive integers', () => {
      expect(parsePositiveVersionNumberParam('2')).toBe(2);
    });

    it('rejects invalid version numbers', () => {
      expect(() => parsePositiveVersionNumberParam('0')).toThrow('versionNumber invalid');
    });
  });

  describe('response mappers', () => {
    it('maps document link rows', () => {
      expect(
        toDocumentLinkResponse({
          id: '1',
          document_id: 'd',
          link_purpose: 'CONTRACT',
          created_at: '2026-01-01T00:00:00.000Z',
        }),
      ).toEqual({
        id: '1',
        documentId: 'd',
        linkPurpose: 'CONTRACT',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('maps history event rows', () => {
      expect(
        toHistoryEventResponse({
          id: '1',
          event_type: 'CREATED',
          payload: { a: 1 },
          actor_identity_id: 'u1',
          occurred_at: '2026-01-01T00:00:00.000Z',
        }),
      ).toEqual({
        id: '1',
        eventType: 'CREATED',
        payload: { a: 1 },
        actorIdentityId: 'u1',
        occurredAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });
});