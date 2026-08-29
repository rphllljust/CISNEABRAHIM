# DBND-CONFLICT-001

| Campo | Valor |
| --- | --- |
| Document ID | Conflitos de fronteira |
| Prompt | 05 |

| ID | Conflito | Contextos | Problema | Impacto | Resolução necessária |
| --- | --- | --- | --- | --- | --- |
| BND-CFL-001 | OS monolítica vs separação execução | BC-006 vs BC-008 | Tendência a colocar execução dentro de OS | Acoplamento; escala equipe | DBND-003 |
| BND-CFL-002 | Medição dentro da OS | BC-006 vs BC-010 | GLQ-004 — entidade ou fase | Ownership medição | DBND-004 |
| BND-CFL-003 | Responsabilidade vs execução | BC-006 vs BC-008 | ASSIGNED/VIEWED ambíguos | Handoff incorreto | DDP-032 |
| BND-CFL-004 | Duplo write PO | BC-004 vs BC-003 | Consumo PO em OS e comercial | Saldo inconsistente | DDP-009 |
| BND-CFL-005 | Pagamento interno vs ERP | BC-013 vs externo | SoT não definido | Duplicidade financeira | DDP-012 |
| BND-CFL-006 | Preço na OS vs ERP | BC-003 vs BC-006 | Alteração preço pós-liberação | Margem errada | FR-031; DDP-031 |
| BND-CFL-007 | Evidência vs documento | BC-009 vs BC-014 | Mesmo arquivo, dois caminhos | Retenção / acesso | DDP-013 |
| BND-CFL-008 | Auditoria em cada BC | BC-017 vs todos | Duplicar AUDIT_TRAIL | Inconsistência trilha | NFR-029 |
| BND-CFL-009 | Reporting com write | BC-016 vs operacionais | CQRS mal aplicado | Corrupção read model | Manter read-only |
| BND-CFL-010 | Identity absorve autorização | BC-001 vs BC-006 | RBAC vs alçada empresarial | Segurança errada | SEC-REQ-001..010 |

Nenhum conflito resolvido por divisão técnica sem decisão empresarial.

Correções documentais: nenhuma alteração retroativa em FR/TERM — conflitos registrados para DBND/DDP.
