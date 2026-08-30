import type { Pool, PoolClient, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../infrastructure/database/database.service';
import { FAULT_HOOKS } from '../platform/fault-injection/fault-hook.ids';
import type { ConfigurableFaultInjectionPort } from './configurable-fault-injection.port';
import { InjectedFaultError } from './configurable-fault-injection.port';

function queryText(first: string | QueryConfig): string {
  return typeof first === 'string' ? first : first.text;
}

function wrapClient(client: PoolClient, faults: ConfigurableFaultInjectionPort): PoolClient {
  const originalQuery = client.query.bind(client);
  let inTransaction = false;

  client.query = (async (...args: Parameters<PoolClient['query']>) => {
    const text = queryText(args[0] as string | QueryConfig);
    if (/^BEGIN\b/i.test(text)) {
      inTransaction = true;
    }
    if (/^(COMMIT|ROLLBACK)\b/i.test(text)) {
      inTransaction = false;
    }
    if (faults.getActiveHook() === FAULT_HOOKS.DbTransactionAbort && inTransaction && !/^BEGIN\b/i.test(text)) {
      inTransaction = false;
      try {
        await originalQuery('ROLLBACK');
      } catch {
        // connection may already be in aborted state
      }
      throw new InjectedFaultError(FAULT_HOOKS.DbTransactionAbort);
    }
    if (faults.getActiveHook() === FAULT_HOOKS.DbConnectionLost) {
      if (inTransaction) {
        inTransaction = false;
        try {
          await originalQuery('ROLLBACK');
        } catch {
          // best-effort cleanup before returning client to pool
        }
      }
      throw new InjectedFaultError(FAULT_HOOKS.DbConnectionLost);
    }
    return originalQuery(...args);
  }) as PoolClient['query'];

  return client;
}

type FaultingDatabaseServiceOptions = {
  /** When set, Nest and harness share one pool (required for stable integration resets). */
  sharedPool?: Pool;
};

type ProxyQueryArgs = [textOrConfig: string | QueryConfig, values?: unknown[]];

export class FaultingDatabaseService extends DatabaseService {
  private readonly ownsConnectionPool: boolean;

  constructor(
    private readonly faults: ConfigurableFaultInjectionPort,
    options?: FaultingDatabaseServiceOptions,
  ) {
    super();
    this.ownsConnectionPool = !options?.sharedPool;
    if (options?.sharedPool) {
      const stale = super.getConnection();
      void stale?.pool.end();
      (this as unknown as { connection: { pool: Pool } | null }).connection = {
        pool: options.sharedPool,
      };
    }
  }

  override async onModuleDestroy(): Promise<void> {
    if (!this.ownsConnectionPool) {
      return;
    }
    await super.onModuleDestroy();
  }

  override getConnection() {
    const connection = super.getConnection();
    if (!connection) {
      return null;
    }
    const faults = this.faults;
    const pool = connection.pool;

    const proxy = new Proxy(pool, {
      get(target, property, receiver): unknown {
        if (property === 'connect') {
          return async () => {
            const hook = faults.getActiveHook();
            if (hook === FAULT_HOOKS.DbConnectionRefused || hook === FAULT_HOOKS.DbPoolUnavailable) {
              throw new InjectedFaultError(hook);
            }
            const client = await target.connect();
            return wrapClient(client, faults);
          };
        }
        if (property === 'query') {
          return async <R extends QueryResultRow = QueryResultRow>(
            ...args: ProxyQueryArgs
          ): Promise<QueryResult<R>> => {
            const hook = faults.getActiveHook();
            if (hook === FAULT_HOOKS.DbConnectionLost || hook === FAULT_HOOKS.DbPoolUnavailable) {
              throw new InjectedFaultError(hook);
            }
            const [textOrConfig, values] = args;
            if (typeof textOrConfig === 'string') {
              return values ? target.query<R>(textOrConfig, values) : target.query<R>(textOrConfig);
            }
            return values ? target.query<R>(textOrConfig, values) : target.query<R>(textOrConfig);
          };
        }
        return Reflect.get(target, property, receiver);
      },
    });

    return { ...connection, pool: proxy };
  }
}
