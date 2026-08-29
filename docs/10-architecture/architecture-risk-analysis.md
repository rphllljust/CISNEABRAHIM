# ARCH-RISK-001

| Campo       | Valor                           |
| ----------- | ------------------------------- |
| Document ID | Análise de riscos arquiteturais |
| Total       | 14 (ARCH-RISK-001..014)         |
| Prompt      | 09                              |

| ID            | Risco                              | Prob. | Impacto | Mitigação                     | ADR/DRV      |
| ------------- | ---------------------------------- | ----- | ------- | ----------------------------- | ------------ |
| ARCH-RISK-001 | Monólito vira big ball of mud      | Média | Alta    | MOD-*, DR-005/006             | ADR-001      |
| ARCH-RISK-002 | Distribuição prematura             | Média | Alta    | Rejeitar microservices início | ADR-001      |
| ARCH-RISK-003 | DDPs movem fronteiras após código  | Alta  | Média   | FOUNDATION first              | ARCH-DRV-002 |
| ARCH-RISK-004 | Consistência financeira fraca      | Média | Crítica | ACID local, idempotência      | ADR-004      |
| ARCH-RISK-005 | Integração contamina domínio       | Média | Alta    | BC-018 ACL                    | ADR-005      |
| ARCH-RISK-006 | AuthZ só na UI                     | Média | Crítica | Application gate              | ARCH-SEC     |
| ARCH-RISK-007 | Shared DB sem ownership            | Média | Alta    | ADR-003                       | ADR-003      |
| ARCH-RISK-008 | Stack escolhida antes do domínio   | Baixa | Alta    | ED-004, ADR-012               | ED-004       |
| ARCH-RISK-009 | Volume futuro subdimensiona        | ?     | Média   | Extração readiness            | modularity   |
| ARCH-RISK-010 | Equipe pequena opera microservices | ?     | Alta    | Modular monolith              | ARCH-DRV-013 |
| ARCH-RISK-011 | SoT pagamento externo mal modelado | Média | Crítica | DDP-012, reconciliação        | ADR-005      |
| ARCH-RISK-012 | Observabilidade vaza custo/PII     | Média | Alta    | EP-021                        | ARCH-SEC     |
| ARCH-RISK-013 | Outbox/saga escolhidos cedo demais | Média | Média   | ARCH-DDP-004                  | ADR-004      |
| ARCH-RISK-014 | PostgreSQL assumido sem validação  | Baixa | Média   | ARCH-DDP-001 PROPOSED         | TOPO-002     |

## Riscos herdados (foundation)

RISK-003, RISK-010, RISK-013, RISK-020, RISK-024 — ver risk-register.md.

## Sinais de revisão arquitetural

- Sizing definido (DDP-017)
- Latência cross-module > threshold
- Deploy único bloqueia equipes
- Necessidade comprovada de escala horizontal
