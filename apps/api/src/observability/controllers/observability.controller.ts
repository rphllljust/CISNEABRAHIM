import { Controller, Get } from '@nestjs/common';
import {
  ObservabilityMetricsService,
  type ObservabilityMetricsResponse,
} from '../services/observability-metrics.service';
import {
  TechnicalAlertService,
  type TechnicalAlertsResponse,
} from '../services/technical-alert.service';

@Controller('observability')
export class ObservabilityController {
  constructor(
    private readonly metricsService: ObservabilityMetricsService,
    private readonly technicalAlerts: TechnicalAlertService,
  ) {}

  @Get('metrics')
  async getMetrics(): Promise<ObservabilityMetricsResponse> {
    return this.metricsService.collect();
  }

  @Get('alerts')
  async getTechnicalAlerts(): Promise<TechnicalAlertsResponse> {
    return this.technicalAlerts.evaluate();
  }
}
