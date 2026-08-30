import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { ObservabilityMetricsService } from './observability-metrics.service';
import { MetricsRegistryService } from '../metrics/metrics-registry.service';
import { PlatformMetricsCollectorService } from './platform-metrics-collector.service';
import { BusinessMetricsCollectorService } from './business-metrics-collector.service';

describe('ObservabilityMetricsService', () => {
  it('separates technical and business metrics', async () => {
    const metrics = new MetricsRegistryService();
    metrics.recordHttpRequest(15, false);
    metrics.setWorkerMetrics({
      processed: 1,
      succeeded: 1,
      retried: 0,
      failedPermanent: 0,
      deadLettered: 0,
      inFlight: 0,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObservabilityMetricsService,
        { provide: MetricsRegistryService, useValue: metrics },
        {
          provide: PlatformMetricsCollectorService,
          useValue: {
            collectDbPoolSnapshot: async () => ({
              configured: false,
              total: null,
              idle: null,
              waiting: null,
            }),
            collectBacklogs: async () => ({
              workerPending: 3,
              outboxPending: 2,
              outboxFailed: 1,
              notificationFailures: 0,
              integrationFailures: 0,
            }),
            getRuntimeFailureCounters: () => ({ storageFailures: 0, notificationFailures: 0, integrationFailures: 0 }),
          },
        },
        {
          provide: BusinessMetricsCollectorService,
          useValue: {
            collect: async () => ({
              serviceOrdersOverdue: 4,
              measurementsAging: 2,
              billingAging: 1,
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(ObservabilityMetricsService);
    const snapshot = await service.collect();

    expect(snapshot.technical.http.total).toBe(1);
    expect(snapshot.technical.backlog.workerPending).toBe(3);
    expect(snapshot.business.serviceOrdersOverdue).toBe(4);
    expect(snapshot.business.measurementsAging).toBe(2);
    expect(snapshot.business.billingAging).toBe(1);
  });
});
