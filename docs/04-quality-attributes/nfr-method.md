# QATTR-METHOD-002

| Campo             | Valor                                                       |
| ----------------- | ----------------------------------------------------------- |
| Document ID       | Método de requisitos não funcionais                         |
| Fonte             | SRC-001, SRC-000 (governança)                               |
| Status documental | CANDIDATE                                                   |
| Prompt            | 03 (revisão estrutural)                                     |
| Supersedes        | `quality-attribute-method.md` (histórico preservado no Git) |

> Nenhum NFR promovido a `CONFIRMED` sem fonte primária e validação empresarial.

## Princípios

1. NFRs derivam de evidências, FRs, UCs, riscos e DDPs — não de preferência de stack.
2. Valores não fornecidos pela empresa permanecem `TARGET_NOT_DEFINED` com `MEASUREMENT_METHOD_PENDING` e DDP associado.
3. Segurança empresarial ≠ autenticação técnica; autorização funcional ≠ RBAC técnico.
4. Trilha de auditoria empresarial (`AUDIT_TRAIL`, `DOMAIN_HISTORY`) ≠ log técnico (`TECHNICAL_LOG`).
5. Concorrência e idempotência são **classificadas**, não implementadas nesta etapa.
6. Requisito ≠ mecanismo: registrar a necessidade, não Redis, Kubernetes, JWT, OAuth ou locking.

## Identificadores

| Tipo                    | Padrão      | Exemplo     |
| ----------------------- | ----------- | ----------- |
| Requisito não funcional | NFR-NNN     | NFR-001     |
| Cenário de qualidade    | QA-SC-NNN   | QA-SC-001   |
| Requisito de segurança  | SEC-REQ-NNN | SEC-REQ-001 |
| Questão aberta NFR      | NFNQ-NNN    | NFNQ-001    |

## Status de NFR

`DRAFT` · `PENDING_SOURCE_VALIDATION` · `PENDING_BUSINESS_DECISION` · `PENDING_MEASUREMENT` · `BLOCKED` · `CONFIRMED` · `REJECTED` · `SUPERSEDED`

**Regra Prompt 03:** com SRC-001 isolada, usar `PENDING_SOURCE_VALIDATION`, `PENDING_MEASUREMENT` ou `PENDING_BUSINESS_DECISION`. Proibido `CONFIRMED` para obrigação empresarial.

## Campos obrigatórios por NFR

| Campo                               | Descrição                                           |
| ----------------------------------- | --------------------------------------------------- |
| ID e título                         | Identificador imutável                              |
| Categoria                           | Segurança, integridade, disponibilidade, etc.       |
| Declaração normativa                | O que o sistema deverá garantir                     |
| Razão empresarial                   | Por que o controle importa (risco, FR, operação)    |
| Fontes e EV-IDs                     | Proveniência                                        |
| BRs, FRs, UCs e riscos relacionados | Rastreabilidade                                     |
| Ativo ou operação protegida         | Artefato ou fluxo empresarial                       |
| Criticidade                         | CRITICAL, HIGH, MEDIUM, LOW                         |
| Escopo                              | GLOBAL, módulo ou entidade candidata                |
| Condição de aplicação               | Quando o requisito se aplica                        |
| Medida                              | O que será medido                                   |
| Unidade                             | Unidade de medida — `TARGET_NOT_DEFINED` se ausente |
| Valor-alvo                          | Meta — `TARGET_NOT_DEFINED` se ausente              |
| Método futuro de verificação        | `MEASUREMENT_METHOD_PENDING` se ausente             |
| Ambiente de verificação             | `TBD` até existir ambiente de teste                 |
| Tolerância                          | `TARGET_NOT_DEFINED` se ausente                     |
| Owner                               | Responsável — `UNKNOWN` se ausente                  |
| DDPs                                | Decisões pendentes                                  |
| Status                              | Conforme tabela acima                               |

Quando campos opcionais de medição não existem na fonte: `TARGET_NOT_DEFINED` e `MEASUREMENT_METHOD_PENDING`.

## Classificações de segurança

`BUSINESS_SECURITY_REQUIREMENT` · `APPLICATION_SECURITY_REQUIREMENT` · `INFRASTRUCTURE_SECURITY_REQUIREMENT` · `OPEN_SECURITY_DECISION`

## Classificações de consistência (por operação)

`STRONG_TRANSACTIONAL` · `STRONG_WITHIN_BOUNDARY` · `EVENTUAL_ACCEPTABLE` · `REPORTING_ONLY` · `UNKNOWN`

## Classificações de concorrência

`NONE` · `LOW` · `OPTIMISTIC_CANDIDATE` · `EXCLUSIVE_RESOURCE` · `FINANCIAL_RACE` · `DEDUPLICATION_REQUIRED` · `UNKNOWN`

## Idempotência / sensibilidade a repetição

`SAFE_REPEAT` · `IDEMPOTENCY_REQUIRED` · `UNIQUE_BUSINESS_OPERATION` · `UNKNOWN`

## Tipos de registro observável

`DOMAIN_HISTORY` · `AUDIT_TRAIL` · `SECURITY_AUDIT` · `TECHNICAL_LOG` · `METRIC` · `TRACE` · `ALERT`

## Classificação de sensibilidade de auditoria (proporcional)

`NONE` · `STANDARD` · `SENSITIVE` · `FINANCIAL` · `SECURITY_CRITICAL` · `UNKNOWN`

Nem toda leitura comum exige auditoria reforçada.

## Classificação de dados (privacidade)

`PUBLIC` · `INTERNAL` · `CONFIDENTIAL` · `RESTRICTED`

Validações LGPD, jurídico, fiscal e contabilidade: **pendentes** — sem base legal inventada.

## Trade-offs explícitos (sem vencedor imposto)

| Trade-off | Polo A                       | Polo B                    | Contexto                                  | DDP              | Status |
| --------- | ---------------------------- | ------------------------- | ----------------------------------------- | ---------------- | ------ |
| TO-001    | Segurança (autorização, SoD) | Usabilidade (agilidade)   | Liberação rápida vs controle              | DDP-003, DDP-022 | OPEN   |
| TO-002    | Consistência forte           | Disponibilidade           | Integração síncrona com ERP               | DDP-014, DDP-020 | OPEN   |
| TO-003    | Auditoria completa           | Privacidade / minimização | Logs e histórico com PII                  | DDP-039, DDP-019 | OPEN   |
| TO-004    | Retenção longa               | Minimização de dados      | Documentos e histórico                    | DDP-019          | OPEN   |
| TO-005    | Rastreabilidade total        | Custo de armazenamento    | Histórico OS, versões                     | DDP-019          | OPEN   |
| TO-006    | Performance (relatórios)     | Validação rigorosa        | Consultas pesadas vs regras em tempo real | DDP-036          | OPEN   |
| TO-007    | Flexibilidade operacional    | Integridade financeira    | Adicionais em campo vs autorização        | DDP-004          | OPEN   |
| TO-008    | Operação offline             | Consistência central      | DDP-018                                   | OPEN             |
| TO-009    | Integração síncrona          | Resiliência               | Falha externa vs latência                 | DDP-014          | OPEN   |
| TO-010    | Notificação ativa (WhatsApp) | Registro mínimo de evento | CAPABILITY_ONLY vs EVENT_MUST_BE_RECORDED | DDP-021          | OPEN   |

## Proibições

Não inventar: disponibilidade %, latência, throughput, usuários, volumes, retenção numérica, RPO, RTO, SLA, SLO, réplicas, região, algoritmo de criptografia, ferramenta de observabilidade, obrigação LGPD específica, conformidade absoluta.
