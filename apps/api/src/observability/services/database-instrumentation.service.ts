import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { MetricsRegistryService } from '../metrics/metrics-registry.service';

type QueryArgs = Parameters<Pool['query']>;

function instrumentPoolQuery(pool: Pool, metrics: MetricsRegistryService): void {
  const original = pool.query.bind(pool);
  const instrumented = async (...args: QueryArgs) => {
    const startedAt = Date.now();
    try {
      const result = await (original as (...queryArgs: QueryArgs) => Promise<unknown>)(...args);
      metrics.recordDbQuery(Date.now() - startedAt, false);
      return result;
    } catch (error) {
      metrics.recordDbQuery(Date.now() - startedAt, true);
      throw error;
    }
  };
  pool.query = instrumented as Pool['query'];
}

@Injectable()
export class DatabaseInstrumentationService implements OnModuleInit {
  private instrumented = false;

  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly metrics?: MetricsRegistryService,
  ) {}

  onModuleInit(): void {
    if (!this.metrics || this.instrumented) {
      return;
    }
    const connection = this.databaseService.getConnection();
    if (!connection) {
      return;
    }
    instrumentPoolQuery(connection.pool, this.metrics);
    this.instrumented = true;
  }

  instrumentClient(client: PoolClient): void {
    if (!this.metrics) {
      return;
    }
    instrumentPoolQuery(client as unknown as Pool, this.metrics);
  }
}
