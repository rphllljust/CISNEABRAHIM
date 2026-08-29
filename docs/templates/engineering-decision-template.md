# Template — decisão de engenharia (ED / ADR leve)

## Campos obrigatórios

| Campo                 | Obrigatório  |
| --------------------- | ------------ |
| ID (`ED-NNN`)         | Sim          |
| Title                 | Sim          |
| Status                | Sim          |
| Decision              | Sim          |
| Why                   | Sim          |
| Consequences          | Sim          |
| Alternatives rejected | Se houver    |
| SOURCE / prompt       | Sim          |
| Date                  | Sim          |
| Revisit when          | Sim ou `TBD` |

## Status permitidos

```text
PROPOSED
ACCEPTED
DEPRECATED
SUPERSEDED
REJECTED
```

Decisões de stack **não** devem ir para `ACCEPTED` antes da etapa correspondente (roadmap preliminar: Prompt 10), salvo correção explícita deste roadmap.

## Como citar fontes

Governança: SRC-000. Restrições empresariais: SRC de infraestrutura/jurídico quando existirem. Não citar “boa prática” como se fosse requisito do cliente.

## Como registrar incerteza

`PROPOSED` + riscos. Não marcar `ACCEPTED` para tecnologia nesta fase FOUNDATION (exceto ED-001–ED-004 já aceitas).

## Como preservar histórico

ADR sucessor referencia `ED` anterior. Não reescrever silenciosamente a decisão aceita.

## Quando bloqueia implementação

- ED `PROPOSED` da qual o código depende → bloqueio.
- Conflito ED vs BR `CONFIRMED` → registrar; não “ajustar a regra”.
