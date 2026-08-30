import { Injectable } from '@nestjs/common';
import { MetricsRegistryService } from '../metrics/metrics-registry.service';
import { BusinessMetricsCollectorService } from '../services/business-metrics-collector.service';
import { PlatformMetricsCollectorService } from '../services/platform-metrics-collector.service';

export type ObservabilityMetricsResponse = {
  collectedAt: string;
  technical: {
    http: ReturnType<MetricsRegistryService['getHttpSnapshot']>;
    db: ReturnType<MetricsRegistryService['getDbSnapshot']> & {
      pool: Awaited<ReturnType<PlatformMetricsCollectorService['collectDbPoolSnapshot']>>;
    };
    worker: ReturnType<MetricsRegistryService['getWorkerSnapshot']>;
    backlog: Awaited<ReturnType<PlatformMetricsCollectorService['collectBacklogs']>>;
    failures: ReturnType<PlatformMetricsCollectorService['getRuntimeFailureCounters']>;
  };
  business: Awaited<ReturnType<BusinessMetricsCollectorService['collect']>>;
};

@Injectable()
export class ObservabilityMetricsService {
  constructor(
    private readonly metrics: MetricsRegistryService,
    private readonly platform: PlatformMetricsCollectorService,
    private readonly business: BusinessMetricsCollectorService,
  ) {}

  async collect(): Promise<ObservabilityMetricsResponse> {
    const [pool, backlog, businessMetrics] = await Promise.all([
      this.platform.collectDbPoolSnapshot(),
      this.platform.collectBacklogs(),
      this.business.collect(),
    ]);

    return {
      collectedAt: new Date().toISOString(),
      technical: {
        http: this.metrics.getHttpSnapshot(),
        db: {
          ...this.metrics.getDbSnapshot(),
          pool,
        },
        worker: this.metrics.getWorkerSnapshot(),
        backlog,
        failures: this.platform.getRuntimeFailureCounters(),
      },
      business: businessMetrics,
    };
  }
}
