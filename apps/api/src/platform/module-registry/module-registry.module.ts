import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ModuleRegistryController } from './module-registry.controller';
import { assertRegistryDefinitions, MODULE_REGISTRY_DEFINITIONS } from './module-registry';

// Fail fast at module init if any definition references an invented capability
// or resource (registry integrity is a release invariant).
assertRegistryDefinitions(MODULE_REGISTRY_DEFINITIONS);

@Module({
  imports: [AuthModule],
  controllers: [ModuleRegistryController],
})
export class ModuleRegistryModule {}
