import { Controller, ForbiddenException, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../../auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AccessTokenClaims } from '../../auth/services/token.service';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { buildModuleRegistrySummary, findModuleRegistryEntry } from './module-registry';

/**
 * Enterprise module registry — read-only governance metadata.
 *
 * - GET /api/v1/modules/registry          => governance summary (no technical
 *   capabilities/resources/routes exposed to ordinary authenticated users).
 * - GET /api/v1/modules/registry/:code    => technical detail, gated by the
 *   platform-scoped capability platform:module-registry:read (PDP enforces;
 *   hiding the menu is never the security boundary). Detalhe técnico do
 *   registry NÃO compartilha o privilégio authz:access-admin:read do console
 *   de Access Administration.
 */
@Controller('modules/registry')
@UseGuards(JwtAuthGuard)
export class ModuleRegistryController {
  constructor(private readonly pdp: PolicyDecisionPointService) {}

  @Get()
  list(): ReturnType<typeof buildModuleRegistrySummary> {
    return buildModuleRegistrySummary(process.env);
  }

  @Get(':moduleCode')
  async get(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('moduleCode') moduleCode: string,
  ): Promise<ReturnType<typeof findModuleRegistryEntry>> {
    const decision = await this.pdp.decide(
      { identityId: auth.sub, sessionId: auth.sid },
      {
        action: AUTHZ_ACTIONS.PlatformModuleRegistryRead,
        resourceType: AUTHZ_RESOURCE_TYPES.Platform,
      },
    );
    if (decision.result !== 'ALLOW') {
      throw new ForbiddenException({ error: { code: 'AUTHZ_DENIED', message: 'Access denied.' } });
    }
    const entry = findModuleRegistryEntry(moduleCode, process.env);
    if (!entry) {
      throw new NotFoundException({ error: { code: 'MODULE_NOT_FOUND', message: 'Module not registered.' } });
    }
    return entry;
  }
}
