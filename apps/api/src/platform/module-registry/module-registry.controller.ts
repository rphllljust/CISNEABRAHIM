import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { buildModuleRegistry, findModuleRegistryEntry, MODULE_REGISTRY_DEFINITIONS } from './module-registry';

/**
 * Enterprise module registry — read-only metadata for authenticated consumers
 * (the web shell may query it to render navigation/feature availability).
 * It never carries business rules; capabilities/resources are projected from
 * the canonical authorization catalog. Unknown module codes are 404 so a
 * client cannot invent modules.
 */
@Controller('modules/registry')
@UseGuards(JwtAuthGuard)
export class ModuleRegistryController {
  @Get()
  list(): ReturnType<typeof buildModuleRegistry> {
    return buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, process.env);
  }

  @Get(':moduleCode')
  get(@Param('moduleCode') moduleCode: string): ReturnType<typeof findModuleRegistryEntry> {
    const entry = findModuleRegistryEntry(moduleCode, process.env);
    if (!entry) {
      throw new NotFoundException({ error: { code: 'MODULE_NOT_FOUND', message: 'Module not registered.' } });
    }
    return entry;
  }
}
