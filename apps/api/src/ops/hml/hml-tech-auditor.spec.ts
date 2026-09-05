import { describe, expect, it } from 'vitest';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { resolveResourceType } from '../../uat/uat-vertical-runner';
import { listHmlTechAuditorActions } from './hml-tech-auditor';

describe('hml-tech-auditor (perfil tecnico de menor privilegio)', () => {
  it('possui somente a leitura tecnica do registry (sem console access-admin)', () => {
    const actions = listHmlTechAuditorActions();
    expect(actions).toEqual([AUTHZ_ACTIONS.PlatformModuleRegistryRead]);
    expect(actions).not.toContain(AUTHZ_ACTIONS.AccessAdminRead);
    expect(actions).not.toContain(AUTHZ_ACTIONS.AccessAdminManage);
  });

  it('mapeia a action platform do registry para o resource Platform (canonico)', () => {
    expect(resolveResourceType(AUTHZ_ACTIONS.PlatformModuleRegistryRead)).toBe(
      AUTHZ_RESOURCE_TYPES.Platform,
    );
  });
});
