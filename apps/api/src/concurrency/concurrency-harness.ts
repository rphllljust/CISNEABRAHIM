import { insertScopeRef } from '@cisne/database';
import {
  createMasterBusinessTestContext,
  type MasterBusinessTestContext,
} from '../master-business/master-business-harness';
import { CONCURRENCY_UNIT } from './concurrency-seeds';

export async function createConcurrencyTestContext(): Promise<MasterBusinessTestContext> {
  const context = await createMasterBusinessTestContext();
  const baseReset = context.resetDatabase;

  context.resetDatabase = async () => {
    await baseReset();
    await insertScopeRef(context.pool, { scopeType: 'UNIT', refId: CONCURRENCY_UNIT });
  };

  await insertScopeRef(context.pool, { scopeType: 'UNIT', refId: CONCURRENCY_UNIT });
  return context;
}
