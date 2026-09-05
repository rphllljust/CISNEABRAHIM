import { createHmac } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { InboxAuthFailureError } from './domain/inbox-errors';
import {
  INTEGRATION_INBOX_ERROR_CLASSES,
  INTEGRATION_INBOX_STATUSES,
} from './domain/inbox-status';
import { TEST_INBOX_EVENT_TYPE } from './handlers/test-integration-inbox.handler';
import { IntegrationsInboxModule } from './integrations-inbox.module';
import { IntegrationInboxRepository } from './repositories/integration-inbox.repository';
import { IntegrationInboxProcessorService } from './services/integration-inbox-processor.service';
import { IntegrationInboxReceiveService } from './services/integration-inbox-receive.service';

describe('Integration inbox PostgreSQL integration', () => {
  let pool: Pool;
  let module: TestingModule;
  let receiveService: IntegrationInboxReceiveService;
  let processor: IntegrationInboxProcessorService;
  let repository: IntegrationInboxRepository;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for integration inbox integration tests.');
    }

    process.env['DATABASE_URL'] = testDatabaseUrl;
    process.env['INBOX_PROCESSOR_ENABLED'] = 'false';

    module = await Test.createTestingModule({
      imports: [DatabaseModule, IntegrationsInboxModule],
    }).compile();

    await module.init();

    receiveService = module.get(IntegrationInboxReceiveService);
    processor = module.get(IntegrationInboxProcessorService);
    repository = module.get(IntegrationInboxRepository);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query(`
      TRUNCATE TABLE
        int.integration_inbox_effects,
        int.integration_inbox
      RESTART IDENTITY CASCADE
    `);
    delete process.env['INTEGRATION_WEBHOOK_SECRET_SECURE_PROVIDER'];
  });

  afterAll(async () => {
    await module.close();
    await pool.end();
  });

  async function receiveAndProcess(input: {
    provider: string;
    externalMessageId: string;
    payload: Record<string, unknown>;
    eventType?: string;
  }): Promise<string> {
    const received = await receiveService.receive({
      provider: input.provider,
      externalMessageId: input.externalMessageId,
      eventType: input.eventType ?? TEST_INBOX_EVENT_TYPE,
      payload: input.payload,
    });
    await processor.processBatch('inbox-test-worker', 10);
    return received.inboxId;
  }

  it('does not duplicate business effects when the same message is received twice', async () => {
    const externalMessageId = `dup-${crypto.randomUUID()}`;
    const payload = { amount: 150 };

    const first = await receiveService.receive({
      provider: 'provider-a',
      externalMessageId,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload,
    });
    const second = await receiveService.receive({
      provider: 'provider-a',
      externalMessageId,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload,
    });

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('duplicate');
    expect(second.inboxId).toBe(first.inboxId);

    await processor.processBatch('inbox-test-worker', 10);
    await processor.processBatch('inbox-test-worker', 10);

    const stored = await repository.findById(first.inboxId);
    expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Processed);
    expect(await repository.countEffects()).toBe(1);
  });

  it('allows the same external message id for different providers', async () => {
    const externalMessageId = `shared-id-${crypto.randomUUID()}`;
    const payload = { amount: 99 };

    await receiveAndProcess({
      provider: 'provider-a',
      externalMessageId,
      payload,
    });
    await receiveAndProcess({
      provider: 'provider-b',
      externalMessageId,
      payload,
    });

    expect(await repository.countEffects()).toBe(2);

    const providerA = await repository.findByProviderAndMessageId('provider-a', externalMessageId);
    const providerB = await repository.findByProviderAndMessageId('provider-b', externalMessageId);
    expect(providerA?.status).toBe(INTEGRATION_INBOX_STATUSES.Processed);
    expect(providerB?.status).toBe(INTEGRATION_INBOX_STATUSES.Processed);
  });

  it('marks invalid payloads without retrying', async () => {
    const inboxId = await receiveAndProcess({
      provider: 'provider-a',
      externalMessageId: `invalid-${crypto.randomUUID()}`,
      payload: { amount: -5 },
    });

    const stored = await repository.findById(inboxId);
    expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Invalid);
    expect(stored?.error_classification).toBe(INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload);
    expect(await repository.countEffects()).toBe(0);

    await processor.processBatch('inbox-test-worker', 10);
    const afterRetry = await repository.findById(inboxId);
    expect(afterRetry?.status).toBe(INTEGRATION_INBOX_STATUSES.Invalid);
  });

  it('marks permanent processing failures without retry', async () => {
    const inboxId = await receiveAndProcess({
      provider: 'provider-a',
      externalMessageId: `permanent-${crypto.randomUUID()}`,
      payload: { amount: 10, _simulatePermanentFailure: true },
    });

    const stored = await repository.findById(inboxId);
    expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Failed);
    expect(stored?.error_classification).toBe(INTEGRATION_INBOX_ERROR_CLASSES.Permanent);
    expect(await repository.countEffects()).toBe(0);
  });

  it('retries transient processing failures and eventually processes', async () => {
    const externalMessageId = `transient-${crypto.randomUUID()}`;
    const received = await receiveService.receive({
      provider: 'provider-a',
      externalMessageId,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload: { amount: 42, _simulateTransientFailure: true },
      maxAttempts: 3,
    });

    await processor.processBatch('inbox-test-worker', 10);
    let stored = await repository.findById(received.inboxId);
    expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Received);
    expect(stored?.error_classification).toBe(INTEGRATION_INBOX_ERROR_CLASSES.Transient);
    expect(stored?.attempts).toBe(1);

    await pool.query(
      `UPDATE int.integration_inbox SET run_after = NOW() - interval '1 second' WHERE id = $1::uuid`,
      [received.inboxId],
    );

    await processor.processBatch('inbox-test-worker', 10);
    stored = await repository.findById(received.inboxId);
    expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Processed);
    expect(stored?.attempts).toBe(2);
    expect(await repository.countEffects()).toBe(1);
  });

  it('prevents duplicate workers from processing the same inbox row', async () => {
    const externalMessageId = `concurrency-${crypto.randomUUID()}`;
    await receiveService.receive({
      provider: 'provider-a',
      externalMessageId,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload: { amount: 77 },
    });

    const [workerA, workerB] = await Promise.all([
      processor.processBatch('inbox-worker-a', 1),
      processor.processBatch('inbox-worker-b', 1),
    ]);

    expect(workerA + workerB).toBe(1);

    const stored = await repository.findByProviderAndMessageId('provider-a', externalMessageId);
    expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Processed);
    expect(await repository.countEffects()).toBe(1);
  });

  it('rejects webhook messages with invalid signatures when provider secret is configured', async () => {
    const provider = 'secure-provider';
    const secret = 'test-webhook-secret';
    process.env['INTEGRATION_WEBHOOK_SECRET_SECURE_PROVIDER'] = secret;

    const payload = { amount: 25 };
    const rawBody = JSON.stringify(payload);

    await expect(
      receiveService.receive({
        provider,
        externalMessageId: `auth-fail-${crypto.randomUUID()}`,
        eventType: TEST_INBOX_EVENT_TYPE,
        payload,
        rawBody,
        signature: 'invalid-signature',
      }),
    ).rejects.toBeInstanceOf(InboxAuthFailureError);

    const validSignature = createHmac('sha256', secret).update(rawBody).digest('hex');
    const received = await receiveService.receive({
      provider,
      externalMessageId: `auth-ok-${crypto.randomUUID()}`,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload,
      rawBody,
      signature: `sha256=${validSignature}`,
    });

    expect(received.outcome).toBe('created');
    await processor.processBatch('inbox-test-worker', 10);
    expect(await repository.countEffects()).toBe(1);
  });
});
