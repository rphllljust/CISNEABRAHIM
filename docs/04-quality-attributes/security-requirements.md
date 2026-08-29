# QATTR-SEC-001

| Campo | Valor |
| --- | --- |
| Document ID | Requisitos de segurança |
| Fonte | SRC-001 |
| Total entradas | 24 (SEC-REQ-001..SEC-REQ-024) |
| Prompt | 03 |

> Autorização empresarial — **não** RBAC técnico. Sem roles técnicas nomeadas.

## Classificação

| Tipo | Significado |
| --- | --- |
| BUSINESS_SECURITY_REQUIREMENT | Controle de negócio (alçada, SoD, custo) |
| APPLICATION_SECURITY_REQUIREMENT | Comportamento da aplicação futura |
| INFRASTRUCTURE_SECURITY_REQUIREMENT | Infraestrutura futura (sem escolha agora) |
| OPEN_SECURITY_DECISION | Decisão pendente |

| ID | Tipo | Título | FR/NFR | Risco | Status |
| --- | --- | --- | --- | --- | --- |
| SEC-REQ-001 | BUSINESS_SECURITY_REQUIREMENT | Decisão sobre solicitação exige ator autorizado | FR-006; NFR-007 | RISK-007 | PENDING_BUSINESS_DECISION |
| SEC-REQ-002 | BUSINESS_SECURITY_REQUIREMENT | Conversão em OS exige autorização | FR-009; NFR-007 | RISK-013 | PENDING_SOURCE_VALIDATION |
| SEC-REQ-003 | BUSINESS_SECURITY_REQUIREMENT | Liberação de OS exige autorização distinta da preparação | FR-014; NFR-019 | RISK-022 | PENDING_BUSINESS_DECISION |
| SEC-REQ-004 | BUSINESS_SECURITY_REQUIREMENT | Cancelamento e reabertura exigem alçada | FR-020, FR-021 | RISK-013 | PENDING_BUSINESS_DECISION |
| SEC-REQ-005 | BUSINESS_SECURITY_REQUIREMENT | Decisão sobre medição exige ator distinto do preparador | FR-037; NFR-013 | RISK-013 | PENDING_BUSINESS_DECISION |
| SEC-REQ-006 | BUSINESS_SECURITY_REQUIREMENT | Registro de faturamento exige ator financeiro candidato | FR-039 | RISK-005 | PENDING_BUSINESS_DECISION |
| SEC-REQ-007 | BUSINESS_SECURITY_REQUIREMENT | Alteração de preço após liberação exige autorização | FR-031; AUTH-REQ-020 | RISK-009 | PENDING_BUSINESS_DECISION |
| SEC-REQ-008 | BUSINESS_SECURITY_REQUIREMENT | Adicional não planejado exige autorização em execução | FR-018; AUTH-REQ-019 | RISK-019 | PENDING_BUSINESS_DECISION |
| SEC-REQ-009 | BUSINESS_SECURITY_REQUIREMENT | Custo e margem visíveis somente a autorizados | FR-032; NFR-008 | RISK-020 | PENDING_BUSINESS_DECISION |
| SEC-REQ-010 | BUSINESS_SECURITY_REQUIREMENT | Documentos restritos com acesso limitado | FR-042; NFR-010 | RISK-007 | PENDING_BUSINESS_DECISION |
| SEC-REQ-011 | APPLICATION_SECURITY_REQUIREMENT | Sessão com expiração e encerramento | NFR-016 | RISK-007 | PENDING_MEASUREMENT |
| SEC-REQ-012 | APPLICATION_SECURITY_REQUIREMENT | Upload validado quanto a conteúdo malicioso | NFR-017 | RISK-016 | PENDING_MEASUREMENT |
| SEC-REQ-013 | APPLICATION_SECURITY_REQUIREMENT | Segredos não expostos em logs ou UI | NFR-018 | RISK-015 | PENDING_MEASUREMENT |
| SEC-REQ-014 | APPLICATION_SECURITY_REQUIREMENT | Matriz de segregação de funções aplicável | NFR-019 | RISK-013 | PENDING_BUSINESS_DECISION |
| SEC-REQ-015 | APPLICATION_SECURITY_REQUIREMENT | Limitação de enumeração abusiva | NFR-020 | RISK-007 | PENDING_MEASUREMENT |
| SEC-REQ-016 | APPLICATION_SECURITY_REQUIREMENT | Exportação sensível autorizada e registrada | NFR-021 | RISK-020 | PENDING_BUSINESS_DECISION |
| SEC-REQ-017 | OPEN_SECURITY_DECISION | Provedor de identidade e fluxo de autenticação | NFR-022 | RISK-007 | PENDING_MEASUREMENT |
| SEC-REQ-018 | OPEN_SECURITY_DECISION | Política de senha / MFA | — | RISK-007 | PENDING_MEASUREMENT |
| SEC-REQ-019 | OPEN_SECURITY_DECISION | Isolamento entre clientes ou unidades | — | RISK-007 | PENDING_BUSINESS_DECISION |
| SEC-REQ-020 | APPLICATION_SECURITY_REQUIREMENT | Trilha de auditoria de ações administrativas | NFR-029 | RISK-024 | PENDING_SOURCE_VALIDATION |
| SEC-REQ-021 | APPLICATION_SECURITY_REQUIREMENT | Integração externa sem confiar cegamente na resposta | FR-030; NFR-012 | RISK-010 | PENDING_SOURCE_VALIDATION |
| SEC-REQ-022 | INFRASTRUCTURE_SECURITY_REQUIREMENT | Proteção de dados em repouso — mecanismo a definir | — | RISK-015 | PENDING_MEASUREMENT |
| SEC-REQ-023 | INFRASTRUCTURE_SECURITY_REQUIREMENT | Proteção de dados em trânsito — mecanismo a definir | — | RISK-015 | PENDING_MEASUREMENT |
| SEC-REQ-024 | APPLICATION_SECURITY_REQUIREMENT | Ações sensíveis registradas em SECURITY_AUDIT distinto de TECHNICAL_LOG | NFR-029 | RISK-024 | PENDING_SOURCE_VALIDATION |

## Áreas analisadas

- Autenticação futura: SEC-REQ-017, SEC-REQ-018 (OPEN)
- Autorização funcional: SEC-REQ-001..010
- Autorização contextual: SEC-REQ-007, SEC-REQ-008
- Segregação de funções: SEC-REQ-003, SEC-REQ-005, SEC-REQ-014
- Menor privilégio: SEC-REQ-009, SEC-REQ-010
- Isolamento cliente/unidade: SEC-REQ-019 (OPEN)
- Custos e margens: SEC-REQ-009
- Documentos restritos: SEC-REQ-010
- Ações administrativas: SEC-REQ-020, SEC-REQ-024
- Gestão de sessão: SEC-REQ-011
- Upload: SEC-REQ-012
- Segredos: SEC-REQ-013
- Audit trail empresarial: SEC-REQ-020 (≠ log técnico)
- Abuso e enumeração: SEC-REQ-015
- Exportação: SEC-REQ-016
- Integração externa: SEC-REQ-021
