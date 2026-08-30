import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { loadInboxProcessorConfig } from '../config/inbox-processor.config';
import { IntegrationInboxProcessorService } from './integration-inbox-processor.service';

@Injectable()
export class IntegrationInboxProcessorWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationInboxProcessorWorkerService.name);
  private readonly config = loadInboxProcessorConfig();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private shuttingDown = false;
  private inFlight = 0;

  constructor(private readonly processor: IntegrationInboxProcessorService) {}

  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.log('Integration inbox processor disabled (INBOX_PROCESSOR_ENABLED=false)');
      return;
    }
    this.logger.log(`Integration inbox processor starting id=${this.config.workerId}`);
    this.schedulePoll(0);
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  async stop(): Promise<void> {
    this.shuttingDown = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    const deadline = Date.now() + this.config.shutdownGraceMs;
    while (this.inFlight > 0 && Date.now() < deadline) {
      await sleep(50);
    }
    this.logger.log('Integration inbox processor stopped');
  }

  async runOnce(): Promise<number> {
    if (this.shuttingDown) {
      return 0;
    }
    this.inFlight += 1;
    try {
      return await this.processor.processBatch(this.config.workerId, this.config.batchSize);
    } finally {
      this.inFlight -= 1;
    }
  }

  private schedulePoll(delayMs: number): void {
    if (this.shuttingDown) {
      return;
    }
    this.pollTimer = setTimeout(() => {
      void this.pollCycle();
    }, delayMs);
  }

  private async pollCycle(): Promise<void> {
    this.pollTimer = null;
    if (this.shuttingDown) {
      return;
    }
    try {
      await this.runOnce();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Inbox poll cycle failed: ${message}`);
    } finally {
      if (!this.shuttingDown) {
        this.schedulePoll(this.config.pollIntervalMs);
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
