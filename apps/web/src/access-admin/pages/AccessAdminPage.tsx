import { useState } from 'react';
import { PageHeader, Tabs } from '../../ui';
import { AssignmentsTab } from './AssignmentsTab';
import { CapabilitiesTab } from './CapabilitiesTab';
import { RolesTab } from './RolesTab';
import { ScopesTab } from './ScopesTab';
import { SodConflictsTab } from './SodConflictsTab';

const TAB_IDS = {
  roles: 'roles',
  assignments: 'assignments',
  capabilities: 'capabilities',
  scopes: 'scopes',
  conflicts: 'conflicts',
} as const;

export function AccessAdminPage() {
  const [activeId, setActiveId] = useState<string>(TAB_IDS.roles);

  const items = [
    { id: TAB_IDS.roles, label: 'Roles', panel: <RolesTab /> },
    { id: TAB_IDS.assignments, label: 'Atribuições', panel: <AssignmentsTab /> },
    { id: TAB_IDS.capabilities, label: 'Capacidades', panel: <CapabilitiesTab /> },
    { id: TAB_IDS.scopes, label: 'Escopos', panel: <ScopesTab /> },
    { id: TAB_IDS.conflicts, label: 'Conflitos SoD', panel: <SodConflictsTab /> },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Administração de acesso"
        description="Gestão de roles, atribuições e catálogos de autorização. O servidor é a única fonte de autoridade: o cliente envia exatamente o que o usuário escolheu e exibe o que o servidor retorna."
      />
      <Tabs
        items={items}
        activeId={activeId}
        onChange={setActiveId}
        label="Administração de acesso"
      />
    </div>
  );
}
