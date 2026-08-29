# Template — conflito de fonte (SC)

## Campos obrigatórios

| Campo                   | Obrigatório              |
| ----------------------- | ------------------------ |
| ID (`SC-NNN`)           | Sim                      |
| Title                   | Sim                      |
| SOURCE-ID A             | Sim                      |
| Claim A + localizador   | Sim                      |
| SOURCE-ID B             | Sim                      |
| Claim B + localizador   | Sim                      |
| Status                  | Sim                      |
| Impacted BR / DDP / FR  | Sim ou `TBD`             |
| Resolution              | Somente quando resolvido |
| Authority that resolved | Obrigatório na resolução |
| Date                    | Sim                      |

## Status permitidos

```text
OPEN
INVESTIGATING
RESOLVED
UNRESOLVABLE
SUPERSEDED
```

## Como citar fontes

Citação simétrica: os dois polos com localizador. Terceira fonte, se houver, como desempate explícito.

## Como registrar incerteza

Não escolher o polo “mais conveniente”. Se a autoridade não decidiu: `OPEN`.

## Como preservar histórico

Resolução não apaga as claims originais.

## Quando bloqueia implementação

`OPEN` ou `INVESTIGATING` sobre regra crítica → `NOT_READY_FOR_IMPLEMENTATION`. Não implementar “um dos lados”.
