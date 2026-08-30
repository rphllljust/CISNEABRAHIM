import { Injectable } from '@nestjs/common';
import type { BackgroundJobHandler } from '../domain/job-handler.types';
import type { BackgroundJobKind } from '../domain/background-job-kind';

@Injectable()
export class BackgroundJobHandlerRegistry {
  private readonly handlers = new Map<BackgroundJobKind, BackgroundJobHandler>();

  register(handler: BackgroundJobHandler): void {
    this.handlers.set(handler.jobKind, handler);
  }

  get(jobKind: BackgroundJobKind): BackgroundJobHandler | undefined {
    return this.handlers.get(jobKind);
  }

  list(): BackgroundJobHandler[] {
    return [...this.handlers.values()];
  }
}
