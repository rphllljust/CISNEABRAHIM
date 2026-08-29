# REQ-EX-001

| Campo             | Valor                          |
| ----------------- | ------------------------------ |
| Document ID       | Requisitos de erros e exceções |
| Fonte             | SRC-001                        |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em         | 2026-08-28                     |
| Prompt            | 02                             |
| Total             | 18                             |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
>
> | ID     | Exceção                                    | FR     | Condição                                              | Efeito                                     | Retry                      | Status                    |
> | ------ | ------------------------------------------ | ------ | ----------------------------------------------------- | ------------------------------------------ | -------------------------- | ------------------------- |
> | EX-001 | Solicitação duplicada                      | FR-001 | Tentativa de registrar solicitação idêntica candidata | Sinalizar ou impedir conforme regra futura | UNKNOWN                    | PENDING_SOURCE_VALIDATION |
> | EX-002 | Conversão duplicada de solicitação         | FR-008 | Solicitação já convertida                             | Impedir nova conversão                     | Não                        | PENDING_SOURCE_VALIDATION |
> | EX-003 | OS não elegível para execução ou liberação | FR-014 | OS em rascunho ou sem autorização                     | Impedir liberação ou início                | Após correção              | PENDING_SOURCE_VALIDATION |
> | EX-004 | Usuário sem autorização empresarial        | FR-032 | Ação sem alçada candidata                             | Impedir ação                               | Não                        | PENDING_BUSINESS_DECISION |
> | EX-005 | Cancelamento com recursos alocados         | FR-020 | OS com alocações ativas                               | Registrar pendência de tratamento          | Após desalocação candidata | PENDING_BUSINESS_DECISION |
> | EX-006 | Dupla alocação de recurso                  | FR-028 | Recurso alocado simultaneamente                       | Sinalizar conflito                         | Após resolução             | PENDING_SOURCE_VALIDATION |
> | EX-007 | Item faturável sem origem identificável    | FR-038 | Origem ausente                                        | Impedir preparação de cobrança             | Após correção              | PENDING_SOURCE_VALIDATION |
> | EX-008 | Documento ou evidência inválida            | FR-040 | Evidência não vinculável                              | Rejeitar associação candidata              | Sim                        | PENDING_SOURCE_VALIDATION |
> | EX-009 | Versão documental concorrente              | FR-042 | Substituição simultânea                               | Preservar ambas ou sinalizar conflito      | Após reconciliação         | PENDING_SOURCE_VALIDATION |
> | EX-010 | PO com saldo insuficiente                  | FR-033 | Consumo excede saldo candidato                        | Sinalizar ou bloquear conforme DDP-009     | Após ajuste comercial      | PENDING_BUSINESS_DECISION |
> | EX-011 | Medição divergente da execução             | FR-037 | Quantidades ou itens divergentes                      | Registrar divergência para decisão         | Após correção              | PENDING_BUSINESS_DECISION |
> | EX-012 | Nota ou faturamento contestado             | FR-039 | Contestação comercial candidata                       | Registrar contestação sem apagar registro  | Após resolução             | PENDING_BUSINESS_DECISION |
> | EX-013 | Falha de integração externa                | FR-030 | Sistema externo indisponível                          | Não criar sucesso local falso              | Conforme política futura   | PENDING_SOURCE_VALIDATION |
> | EX-014 | Repetição de comando sensível              | FR-008 | Mesma operação reenviada                              | Garantir idempotência candidata            | Deve ser seguro            | PENDING_SOURCE_VALIDATION |
> | EX-015 | Adicional não autorizado                   | FR-018 | Serviço adicional sem autorização                     | Registrar pendência ou impedir             | Após autorização           | PENDING_BUSINESS_DECISION |
> | EX-016 | Recurso indisponível para alocação         | FR-025 | Ativo ou pessoa indisponível                          | Impedir ou sinalizar indisponibilidade     | Sim                        | PENDING_SOURCE_VALIDATION |
> | EX-017 | Conflito de atualização concorrente        | FR-022 | Duas alterações simultâneas na OS                     | Detectar e preservar histórico             | Após reconciliação         | PENDING_SOURCE_VALIDATION |
> | EX-018 | Alteração de preço após liberação          | FR-031 | Preço alterado sem autorização                        | Impedir ou exigir autorização candidata    | Após autorização           | PENDING_BUSINESS_DECISION |

## Detalhamento

### EX-001 — Solicitação duplicada

- **Fonte:** SRC-001
- **Evidências:** EV-027
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-002

### EX-002 — Conversão duplicada de solicitação

- **Fonte:** SRC-001
- **Evidências:** EV-028, EV-034
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-002

### EX-003 — OS não elegível para execução ou liberação

- **Fonte:** SRC-001
- **Evidências:** EV-036
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-003

### EX-004 — Usuário sem autorização empresarial

- **Fonte:** SRC-001
- **Evidências:** EV-078
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-014

### EX-005 — Cancelamento com recursos alocados

- **Fonte:** SRC-001
- **Evidências:** EV-047
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-004

### EX-006 — Dupla alocação de recurso

- **Fonte:** SRC-001
- **Evidências:** EV-053
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-007

### EX-007 — Item faturável sem origem identificável

- **Fonte:** SRC-001
- **Evidências:** EV-017
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-010

### EX-008 — Documento ou evidência inválida

- **Fonte:** SRC-001
- **Evidências:** EV-067
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-002

### EX-009 — Versão documental concorrente

- **Fonte:** SRC-001
- **Evidências:** EV-069
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-012

### EX-010 — PO com saldo insuficiente

- **Fonte:** SRC-001
- **Evidências:** EV-060
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-009

### EX-011 — Medição divergente da execução

- **Fonte:** SRC-001
- **Evidências:** EV-063
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-011

### EX-012 — Nota ou faturamento contestado

- **Fonte:** SRC-001
- **Evidências:** EV-064
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-023

### EX-013 — Falha de integração externa

- **Fonte:** SRC-001
- **Evidências:** EV-077
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-019

### EX-014 — Repetição de comando sensível

- **Fonte:** SRC-001
- **Evidências:** EV-034
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-018

### EX-015 — Adicional não autorizado

- **Fonte:** SRC-001
- **Evidências:** EV-046
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-008

### EX-016 — Recurso indisponível para alocação

- **Fonte:** SRC-001
- **Evidências:** EV-051
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-007

### EX-017 — Conflito de atualização concorrente

- **Fonte:** SRC-001
- **Evidências:** EV-079
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-015

### EX-018 — Alteração de preço após liberação

- **Fonte:** SRC-001
- **Evidências:** EV-060
- **Dados preservados:** Sim — sem perda silenciosa
- **Mensagem empresarial candidata:** A definir com operação
- **Auditabilidade:** CANDIDATE
- **Compensação:** UNKNOWN
- **DDP:** DDP-030
