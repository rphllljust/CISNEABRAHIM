# DBEH-METHOD-001

| Campo       | Valor                                |
| ----------- | ------------------------------------ |
| Document ID | Método de modelagem de comportamento |
| Prompt      | 06                                   |

## Objetivo

Formalizar comportamento empresarial **candidato** antes de aggregates (Prompt 07+) e máquinas de estado definitivas.

## Identificadores

| Tipo              | Padrão   |
| ----------------- | -------- |
| Invariante        | INV-NNN  |
| Comando           | CMD-NNN  |
| Evento de domínio | DE-NNN   |
| Rejeição          | REJ-NNN  |
| Predicado         | PRED-NNN |

## Status de invariante

`CANDIDATE` · `PENDING_SOURCE_VALIDATION` · `PENDING_BUSINESS_DECISION` · `ACCEPTED_FOR_MODELING` · `CONFIRMED` · `REJECTED` · `SUPERSEDED`

**Sem fonte primária:** proibido `CONFIRMED`.

## Classificação de eventos

`DOMAIN_HISTORY_EVENT` · `INTEGRATION_EVENT_CANDIDATE` · `NOTIFICATION_TRIGGER_CANDIDATE` · `AUDIT_ONLY` · `REJECTED_AS_DOMAIN_EVENT`

## Classificação transacional (comando)

`STRONG_TRANSACTIONAL` · `STRONG_WITHIN_BOUNDARY` · `EVENTUAL_WITH_RECONCILIATION` · `REPORTING_ONLY` · `UNKNOWN`

## Idempotência (comando)

`SAFE_REPEAT` · `IDEMPOTENCY_REQUIRED` · `UNIQUE_BUSINESS_OPERATION` · `NOT_REPEATABLE` · `UNKNOWN`

## Separação conceitual

| Conceito                  | Significado                                      |
| ------------------------- | ------------------------------------------------ |
| INVARIANT                 | Regra que deve sempre valer                      |
| POLICY                    | Regra condicional com decisão empresarial        |
| DOMAIN_SERVICE_CANDIDATE  | Operação sem estado próprio; usar com parcimônia |
| APPLICATION_ORCHESTRATION | Coordenação entre contextos — não domínio puro   |
| INTEGRATION_CONCERN       | Tradução/adaptação externa                       |

## Separação de registros

| Registro               | Propósito                                  |
| ---------------------- | ------------------------------------------ |
| Evento de domínio (DE) | Fato passado relevante ao negócio          |
| DOMAIN_HISTORY         | Evolução consultável de estado empresarial |
| AUDIT_TRAIL            | Quem fez o quê, quando                     |
| SECURITY_AUDIT         | Acesso negado, exportação sensível         |
| Integration event      | Fato na fronteira externa                  |
| TECHNICAL_LOG          | Diagnóstico — não domínio                  |

Um fato pode alimentar vários registros; não são o mesmo conceito.

## Proibições

Implementação, classe, interface, schema, enum, endpoint, aggregate definitivo, estado definitivo, evento para toda alteração, evento como log, script auxiliar, outbox/lock como decisão.

## Proteção futura (campos por INV)

- **Backend:** validação na aplicação do BC owner
- **Banco:** constraint candidata — não especificada neste prompt
