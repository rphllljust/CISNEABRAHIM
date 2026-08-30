import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_TEST_DB_LOCK_KEY,
  withIntegrationTestDatabaseLock,
} from './integration-test-db-lock';

describe('withIntegrationTestDatabaseLock', () => {
  it('exposes a stable lock key', () => {
    expect(INTEGRATION_TEST_DB_LOCK_KEY).toBe(0x43534e45);
  });

  it('supports nested acquisition on the same client', async () => {
    const client = {
      lockCalls: 0,
      unlockCalls: 0,
      async query(sql: string) {
        if (sql.includes('pg_advisory_lock')) {
          this.lockCalls += 1;
        }
        if (sql.includes('pg_advisory_unlock')) {
          this.unlockCalls += 1;
        }
      },
    };

    await withIntegrationTestDatabaseLock(client, async () => {
      await withIntegrationTestDatabaseLock(client, async () => 'ok');
      return 'outer';
    });

    expect(client.lockCalls).toBe(1);
    expect(client.unlockCalls).toBe(1);
  });
});
