import { describe, expect, it } from 'vitest';
import { appendPhysicalAssetSearchClause } from './physical-assets.repository';

describe('appendPhysicalAssetSearchClause', () => {
  it('builds exact plate match clauses', () => {
    const params: unknown[] = [];
    const clause = appendPhysicalAssetSearchClause('abc-1d23', params);

    expect(clause).toBe('vp.normalized_plate = $1');
    expect(params).toEqual(['ABC1D23']);
  });

  it('builds prefix code match clauses', () => {
    const params: unknown[] = [];
    const clause = appendPhysicalAssetSearchClause('TRK-001', params);

    expect(clause).toBe("a.asset_code ILIKE $1 ESCAPE '\\'");
    expect(params).toEqual(['TRK-001\\%']);
  });

  it('builds broad text search across code, name and plate display', () => {
    const params: unknown[] = [];
    const clause = appendPhysicalAssetSearchClause('caminhao', params);

    expect(clause).toContain('a.asset_code ILIKE $1');
    expect(clause).toContain('a.name ILIKE $1');
    expect(clause).toContain('vp.plate_display ILIKE $1');
    expect(params).toEqual(['%caminhao%']);
  });

  it('returns null for short or empty search terms', () => {
    const params: unknown[] = [];
    expect(appendPhysicalAssetSearchClause('a', params)).toBeNull();
    expect(appendPhysicalAssetSearchClause('   ', params)).toBeNull();
    expect(params).toEqual([]);
  });
});
