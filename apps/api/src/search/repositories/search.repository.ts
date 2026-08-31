import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { SearchEntityType } from '../domain/search-entity-type';
import type { NormalizedSearchQuery } from '../domain/search-query-normalizer';
import { mergeScopeAndPredicate } from '../domain/search-sql.helper';
import type { SearchResultItem } from '../domain/search-result';
import {
  buildEntitySearchQuery,
  scopeForSearchEntityType,
} from './search-entity-query-builders';
import type { SearchFilters, SearchRow, SearchScopeFilters } from './search.repository.types';

export type { SearchFilters, SearchScopeFilters } from './search.repository.types';

@Injectable()
export class SearchRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_NOT_CONFIGURED');
    }
    return connection.pool;
  }

  async search(
    query: NormalizedSearchQuery,
    scopes: SearchScopeFilters,
    types: SearchEntityType[],
    limit: number,
    offset: number,
    filters: SearchFilters,
  ): Promise<{ groups: Map<SearchEntityType, { total: number; items: SearchResultItem[] }> }> {
    const results = await Promise.all(
      types.map((entityType) =>
        this.searchEntityType(entityType, query, scopes, limit, offset, filters),
      ),
    );

    const groups = new Map<SearchEntityType, { total: number; items: SearchResultItem[] }>();
    for (const result of results) {
      if (result) {
        groups.set(result.entityType, { total: result.total, items: result.items });
      }
    }
    return { groups };
  }

  private async searchEntityType(
    entityType: SearchEntityType,
    query: NormalizedSearchQuery,
    scopes: SearchScopeFilters,
    limit: number,
    offset: number,
    filters: SearchFilters,
  ): Promise<{ entityType: SearchEntityType; total: number; items: SearchResultItem[] } | null> {
    const scope = scopeForSearchEntityType(scopes, entityType);
    if (!scope) {
      return null;
    }

    const search = buildEntitySearchQuery(entityType, query, filters);
    if (!search) {
      return null;
    }

    const merged = mergeScopeAndPredicate(scope, search.predicate, search.params);
    if (merged.clause === 'FALSE') {
      return null;
    }

    const client = await this.pool().connect();
    try {
      await client.query(`SET LOCAL statement_timeout = '5000ms'`);

      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM ${search.fromClause}
         WHERE ${merged.clause}`,
        merged.params,
      );
      const total = Number.parseInt(countResult.rows[0]?.count ?? '0', 10);
      if (total === 0) {
        return null;
      }

      const listParams = [...merged.params, limit, offset];
      const limitIndex = merged.params.length + 1;
      const offsetIndex = merged.params.length + 2;
      const listResult = await client.query<SearchRow>(
        `${search.selectClause}
         FROM ${search.fromClause}
         WHERE ${merged.clause}
         ORDER BY ${search.orderBy}
         LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
        listParams,
      );

      return {
        entityType,
        total,
        items: listResult.rows.map((row) => ({
          entityType,
          entityId: row.entity_id,
          title: row.title,
          subtitle: row.subtitle,
          status: row.status,
          occurredAt: row.occurred_at.toISOString(),
          entityHref: row.entity_href,
          highlights: row.highlight ? [row.highlight] : [],
        })),
      };
    } finally {
      client.release();
    }
  }
}
