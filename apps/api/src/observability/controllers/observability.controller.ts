import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequireAuthz } from '../../authorization/decorators/require-authz.decorator';
import { AuthorizationGuard } from '../../authorization/guards/authorization.guard';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { buildArtifactIdentitySnapshot } from '../artifact/artifact-identity';
import {
  ObservabilityMetricsService,
  type ObservabilityMetricsResponse,
} from '../services/observability-metrics.service';
import {
  TechnicalAlertService,
  type TechnicalAlertsResponse,
} from '../services/technical-alert.service';

@Controller('observability')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
export class ObservabilityController {
  constructor(
    private readonly metricsService: ObservabilityMetricsService,
    private readonly technicalAlerts: TechnicalAlertService,
  ) {}

  @Get('metrics')
  @RequireAuthz({
    action: AUTHZ_ACTIONS.PlatformDiagnosticsRead,
    resourceType: AUTHZ_RESOURCE_TYPES.Platform,
  })
  async getMetrics(): Promise<ObservabilityMetricsResponse> {
    return this.metricsService.collect();
  }

  @Get('alerts')
  @RequireAuthz({
    action: AUTHZ_ACTIONS.PlatformDiagnosticsRead,
    resourceType: AUTHZ_RESOURCE_TYPES.Platform,
  })
  async getTechnicalAlerts(): Promise<TechnicalAlertsResponse> {
    return this.technicalAlerts.evaluate();
  }

  /**
   * Identidade do artefato em execução (prova HML SHA / artefato aprovado /
   * produção SHA). Endpoint autenticado e autorizado (platform:diagnostics:read);
   * expõe somente campos whitelisted sanitizados por buildArtifactIdentitySnapshot
   * — nunca segredos ou conteúdo arbitrário de ambiente.
   */
  @Get('artifact')
  @RequireAuthz({
    action: AUTHZ_ACTIONS.PlatformDiagnosticsRead,
    resourceType: AUTHZ_RESOURCE_TYPES.Platform,
  })
  getArtifactIdentity() {
    return buildArtifactIdentitySnapshot(process.env);
  }
}
