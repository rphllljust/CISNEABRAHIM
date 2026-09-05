import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuthorizationModule } from '../../authorization/authorization.module';
import { ModuleRegistryController } from './module-registry.controller';
import {
  assertModuleRegistryIntegrity,
  assertRegistryDefinitions,
  MODULE_REGISTRY_DEFINITIONS,
} from './module-registry';

// Fail fast at module init: registry integrity is a release invariant
// (código duplicado, gate/rota incompatível, dependência inválida/ciclo,
// capability/resource fora do catálogo canônico).
assertRegistryDefinitions(MODULE_REGISTRY_DEFINITIONS);
assertModuleRegistryIntegrity(MODULE_REGISTRY_DEFINITIONS);

@Module({
  imports: [AuthModule, AuthorizationModule],
  controllers: [ModuleRegistryController],
})
export class ModuleRegistryModule {}
