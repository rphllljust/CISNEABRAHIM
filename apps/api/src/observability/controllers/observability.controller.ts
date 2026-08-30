import { Controller, Get } from '@nestjs/common';
import {
  ObservabilityMetricsService,
  type ObservabilityMetricsResponse,
} from '../services/observability-metrics.service';

@Controller('observability')
export class ObservabilityController {
  constructor(private readonly metricsService: ObservabilityMetricsService) {}

  @Get('metrics')
  async getMetrics(): Promise<ObservabilityMetricsResponse> {
    return this.metricsService.collect();
  }
}
