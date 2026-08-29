# QATTR-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método de atributos de qualidade |
| Fonte | SRC-001, SRC-000 (governança) |
| Status documental | CANDIDATE |
| Prompt | 03 |

> Nenhum NFR promovido a `CONFIRMED` sem fonte primária e validação empresarial.

## Princípios

1. NFRs derivam de evidências, FRs, riscos e decisões pendentes — não de preferência de stack.
2. Valores não fornecidos pela empresa permanecem `TARGET_PENDING` com `MEASUREMENT_METHOD_PENDING` e DDP associado.
3. Segurança empresarial ≠ autenticação técnica; autorização funcional ≠ RBAC técnico.
4. Trilha de auditoria empresarial (`AUDIT_TRAIL`, `DOMAIN_HISTORY`) ≠ log técnico (`TECHNICAL_LOG`).
5. Concorrência e idempotência são **classificadas**, não implementadas nesta etapa.

## Identificadores

| Tipo | Padrão | Exemplo |
| --- | --- | --- |
| Requisito não funcional | NFR-NNN | NFR-001 |
| Cenário de qualidade | QA-SC-NNN | QA-SC-001 |
| Requisito de segurança | SEC-REQ-NNN | SEC-REQ-001 |
| Questão aberta NFR | NFNQ-NNN | NFNQ-001 |

## Status de NFR

`DRAFT` · `PENDING_SOURCE_VALIDATION` · `PENDING_TARGET_DEFINITION` · `PENDING_BUSINESS_DECISION` · `CONFIRMED` · `REJECTED` · `SUPERSEDED`

**Regra Prompt 03:** com SRC-001 isolada, usar `PENDING_SOURCE_VALIDATION`, `PENDING_TARGET_DEFINITION` ou `PENDING_BUSINESS_DECISION`. Proibido `CONFIRMED` para obrigação empresarial.

## Classificações de segurança

`BUSINESS_SECURITY_REQUIREMENT` · `APPLICATION_SECURITY_REQUIREMENT` · `INFRASTRUCTURE_SECURITY_REQUIREMENT` · `OPEN_SECURITY_DECISION`

## Classificações de consistência (por operação)

`STRONG_TRANSACTIONAL` · `STRONG_WITHIN_BOUNDARY` · `EVENTUAL_ACCEPTABLE` · `REPORTING_ONLY` · `UNKNOWN`

## Classificações de concorrência

`NONE` · `OPTIMISTIC_CANDIDATE` · `EXCLUSIVE_RESOURCE` · `FINANCIAL_RACE` · `DEDUPLICATION_REQUIRED` · `UNKNOWN`

## Sensibilidade a repetição

`SAFE_REPEAT` · `IDEMPOTENCY_REQUIRED` · `UNIQUE_BUSINESS_OPERATION` · `UNKNOWN`

## Tipos de registro observável

`DOMAIN_HISTORY` · `AUDIT_TRAIL` · `SECURITY_AUDIT` · `TECHNICAL_LOG` · `METRIC` · `TRACE` · `ALERT`

## Campos obrigatórios por NFR

ID, título, declaração normativa, categoria, fonte, evidências, BRs/FRs relacionadas, risco, criticidade, escopo, estímulo, ambiente, artefato afetado, resposta esperada, medida da resposta, target, método de medição, owner, DDPs, status, critérios de validação.

## Proibições

Não inventar: disponibilidade %, latência, throughput, usuários, volumes, retenção numérica, RPO, RTO, SLA, SLO, réplicas, região, algoritmo de criptografia, ferramenta de observabilidade, obrigação LGPD específica.
