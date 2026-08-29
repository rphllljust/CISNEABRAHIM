# REQ-AUTH-001

| Campo             | Valor                                 |
| ----------------- | ------------------------------------- |
| Document ID       | Requisitos de autorização empresarial |
| Fonte             | SRC-001                               |
| Status documental | CANDIDATE — sem fonte primária        |
| Gerado em         | 2026-08-28                            |
| Prompt            | 02                                    |
| Total             | 20                                    |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
> Autorização empresarial — **não** RBAC técnico. Sem nomes de roles técnicas.

| ID           | Ação                                                            | Ator candidato                              | Escopo       | FR     | SoD candidata                              | Status                    |
| ------------ | --------------------------------------------------------------- | ------------------------------------------- | ------------ | ------ | ------------------------------------------ | ------------------------- |
| AUTH-REQ-001 | Registrar e consultar solicitação                               | Solicitante candidato                       | GLOBAL       | FR-001 | UNKNOWN                                    | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-002 | Decidir aprovação ou rejeição de solicitação                    | Autorizador empresarial candidato           | UNKNOWN      | FR-006 | Candidata — solicitante ≠ autorizador      | PENDING_BUSINESS_DECISION |
| AUTH-REQ-003 | Converter solicitação em OS                                     | Autorizador empresarial candidato           | GLOBAL       | FR-009 | Candidata                                  | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-004 | Criar rascunho de OS                                            | Operacional candidato                       | GLOBAL       | FR-010 | UNKNOWN                                    | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-005 | Editar conteúdo, itens, recursos e referências comerciais da OS | Operacional candidato                       | SERVICE_TYPE | FR-011 | Candidata — separar preparação e liberação | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-006 | Liberar OS                                                      | Autorizador empresarial candidato           | GLOBAL       | FR-014 | Candidata — quem prepara ≠ quem libera     | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-007 | Atribuir responsável e alocar recursos                          | Operacional candidato                       | GLOBAL       | FR-015 | UNKNOWN                                    | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-008 | Executar OS e registrar progresso, substituições e evidências   | Executor candidato                          | GLOBAL       | FR-017 | Candidata                                  | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-009 | Concluir OS                                                     | Executor ou autorizador candidato           | GLOBAL       | FR-019 | UNKNOWN                                    | PENDING_BUSINESS_DECISION |
| AUTH-REQ-010 | Cancelar OS                                                     | Autorizador empresarial candidato           | GLOBAL       | FR-020 | Candidata                                  | PENDING_BUSINESS_DECISION |
| AUTH-REQ-011 | Reabrir OS concluída                                            | Autorizador empresarial candidato           | UNKNOWN      | FR-021 | Candidata                                  | PENDING_BUSINESS_DECISION |
| AUTH-REQ-012 | Visualizar custo e margem                                       | Financeiro ou direção candidatos            | GLOBAL       | FR-032 | Candidata                                  | PENDING_BUSINESS_DECISION |
| AUTH-REQ-013 | Preparar medição                                                | Analista de medição candidato               | UNKNOWN      | FR-035 | UNKNOWN                                    | PENDING_BUSINESS_DECISION |
| AUTH-REQ-014 | Decidir sobre medição                                           | Autorizador empresarial candidato           | UNKNOWN      | FR-037 | Candidata — quem mede ≠ quem aprova        | PENDING_BUSINESS_DECISION |
| AUTH-REQ-015 | Registrar documento de faturamento ou nota informada            | Financeiro candidato                        | UNKNOWN      | FR-039 | Candidata                                  | PENDING_BUSINESS_DECISION |
| AUTH-REQ-016 | Registrar e versionar documentos lógicos                        | Responsável documental candidato            | GLOBAL       | FR-041 | UNKNOWN                                    | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-017 | Substituir documento e controlar acesso                         | Responsável documental ou gestão candidatos | GLOBAL       | FR-042 | Candidata                                  | PENDING_SOURCE_VALIDATION |
| AUTH-REQ-018 | Anexar evidências à solicitação                                 | Solicitante candidato                       | UNKNOWN      | FR-004 | NOT_APPLICABLE                             | PENDING_BUSINESS_DECISION |
| AUTH-REQ-019 | Registrar adicional não planejado em execução                   | Executor com autorização candidata          | SERVICE_TYPE | FR-018 | Candidata                                  | PENDING_BUSINESS_DECISION |
| AUTH-REQ-020 | Alterar preço comercial após liberação                          | Autorizador comercial candidato             | CONTRACT     | FR-031 | Candidata                                  | PENDING_BUSINESS_DECISION |

## Detalhamento

### AUTH-REQ-001 — Registrar e consultar solicitação

- **Evidências:** EV-027
- **BR:** BR-024
- **Risco:** Registro indevido
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-002 — Decidir aprovação ou rejeição de solicitação

- **Evidências:** EV-033
- **BR:** BR-024
- **Risco:** Decisão sem alçada
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-003 — Converter solicitação em OS

- **Evidências:** EV-028
- **BR:** BR-001
- **Risco:** Conversão indevida
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-003
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-004 — Criar rascunho de OS

- **Evidências:** EV-036
- **BR:** BR-006
- **Risco:** Criação não autorizada
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-003
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-005 — Editar conteúdo, itens, recursos e referências comerciais da OS

- **Evidências:** EV-040
- **BR:** BR-007
- **Risco:** Alteração indevida
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-004
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-006 — Liberar OS

- **Evidências:** EV-013, EV-039
- **BR:** BR-006
- **Risco:** Liberação sem controle
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-003
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-007 — Atribuir responsável e alocar recursos

- **Evidências:** EV-071
- **BR:** BR-019
- **Risco:** Atribuição incorreta
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-015
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-008 — Executar OS e registrar progresso, substituições e evidências

- **Evidências:** EV-044
- **BR:** BR-006
- **Risco:** Execução não autorizada
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-003
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-009 — Concluir OS

- **Evidências:** EV-045
- **BR:** BR-024
- **Risco:** Conclusão prematura
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-005
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-010 — Cancelar OS

- **Evidências:** EV-047
- **BR:** BR-024
- **Risco:** Cancelamento indevido
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-005
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-011 — Reabrir OS concluída

- **Evidências:** EV-047
- **BR:** BR-024
- **Risco:** Reabertura indevida
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-005
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-012 — Visualizar custo e margem

- **Evidências:** EV-061, EV-078
- **BR:** BR-018
- **Risco:** Exposição indevida de margem
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-009
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-013 — Preparar medição

- **Evidências:** EV-062
- **BR:** BR-009
- **Risco:** Medição incorreta
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-011
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-014 — Decidir sobre medição

- **Evidências:** EV-062
- **BR:** BR-009
- **Risco:** Aprovação indevida
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-011
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-015 — Registrar documento de faturamento ou nota informada

- **Evidências:** EV-064
- **BR:** BR-015
- **Risco:** Registro financeiro indevido
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-023
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-016 — Registrar e versionar documentos lógicos

- **Evidências:** EV-067
- **BR:** BR-016
- **Risco:** Perda documental
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-012
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-017 — Substituir documento e controlar acesso

- **Evidências:** EV-021, EV-069
- **BR:** BR-016, BR-020
- **Risco:** Alteração por não autorizado
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-013
- **Status:** PENDING_SOURCE_VALIDATION

### AUTH-REQ-018 — Anexar evidências à solicitação

- **Evidências:** EV-030
- **BR:** BR-024
- **Risco:** Evidência inadequada
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-002
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-019 — Registrar adicional não planejado em execução

- **Evidências:** EV-046
- **BR:** BR-024
- **Risco:** Cobrança sem origem
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-008
- **Status:** PENDING_BUSINESS_DECISION

### AUTH-REQ-020 — Alterar preço comercial após liberação

- **Evidências:** EV-060
- **BR:** BR-013
- **Risco:** Margem indevida
- **Autorização contextual:** CANDIDATE
- **DDP:** DDP-030
- **Status:** PENDING_BUSINESS_DECISION
